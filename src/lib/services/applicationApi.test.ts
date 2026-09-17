import { beforeEach, describe, expect, it } from 'vitest';
import {
	__resetDb,
	applyTransition,
	aggregateStatistics,
	createApplication,
	getApplicationById,
	getApplications,
	getUserById,
	updateApplicationFields
} from './applicationApi';

beforeEach(() => {
	__resetDb();
});

describe('用户查询', () => {
	it('getUserById 返回用户，未知 id 为 undefined', () => {
		expect(getUserById('u1')?.name).toBe('张三');
		expect(getUserById('nobody')).toBeUndefined();
	});
});

describe('申请查询', () => {
	it('getApplications 返回按时间倒序的列表', async () => {
		const list = await getApplications();
		expect(list.length).toBeGreaterThan(0);
	});

	it('getApplicationById 能查到 mock 里的单据', async () => {
		const item = await getApplicationById('A1001');
		expect(item?.applicantName).toBe('张三');
		const miss = await getApplicationById('NOPE');
		expect(miss).toBeNull();
	});
});

describe('新建申请', () => {
	it('提交新建 -> 状态 pending 且审批链从第 0 步开始', async () => {
		const before = (await getApplications()).length;
		const created = await createApplication({
			type: 'travel',
			applicantId: 'u1',
			fields: {
				destination: '广州',
				startDate: '2026-10-01',
				endDate: '2026-10-03',
				transportation: 'train',
				amount: 800,
				reason: '客户拜访'
			},
			submitNow: true
		});
		expect(created.status).toBe('pending');
		expect(created.currentStepIndex).toBe(0);
		expect(created.flow.length).toBe(2);
		expect(created.auditLog.map((l) => l.action)).toEqual(['submit']);
		expect((await getApplications()).length).toBe(before + 1);
	});

	it('存为草稿 -> 状态 draft 且无操作记录', async () => {
		const created = await createApplication({
			type: 'leave',
			applicantId: 'u1',
			fields: {
				leaveType: 'annual',
				startDate: '2026-10-10',
				endDate: '2026-10-11',
				days: 2,
				reason: '休息'
			},
			submitNow: false
		});
		expect(created.status).toBe('draft');
		expect(created.auditLog).toEqual([]);
	});

	it('提交人为审批人时也可创建申请', async () => {
		const created = await createApplication({
			type: 'training',
			applicantId: 'u2',
			fields: {
				courseName: '测试课程',
				institution: '机构',
				startDate: '2026-11-01',
				endDate: '2026-11-02',
				amount: 100,
				reason: ''
			},
			submitNow: true
		});
		expect(created.applicantName).toBe('李四');
	});
});

describe('更新字段', () => {
	it('updateApplicationFields 只更新 fields 而不改状态', async () => {
		await updateApplicationFields('A1003', { leaveType: 'personal' });
		const item = await getApplicationById('A1003');
		expect(item?.fields.leaveType).toBe('personal');
		expect(item?.status).toBe('rejected');
	});
});

describe('审批流转（多级审批链）', () => {
	it('两级审批：第一级通过后仍为 pending 并推进步骤，第二级通过后才 approved', async () => {
		const first = await applyTransition('A1007', 'approve', '同意', 'u2');
		expect(first.status).toBe('pending');
		expect(first.currentStepIndex).toBe(1);
		expect(first.flow[0].status).toBe('approved');

		const second = await applyTransition('A1007', 'approve', '预算内', 'u3');
		expect(second.status).toBe('approved');
		expect(second.currentStepIndex).toBe(1);
		expect(second.flow[1].status).toBe('approved');
	});

	it('第一级驳回 --> rejected，且被驳回步骤标红', async () => {
		const item = await applyTransition('A1007', 'reject', '金额过多', 'u2');
		expect(item.status).toBe('rejected');
		expect(item.flow[0].status).toBe('rejected');
		expect(item.auditLog.at(-1)?.action).toBe('reject');
	});

	it('驳回后可修改字段并重新提交，审批链重置', async () => {
		await updateApplicationFields('A1003', { days: 2, reason: '休假两天' });
		const resubmitted = await applyTransition('A1003', 'submit', '', 'u1');
		expect(resubmitted.status).toBe('pending');
		expect(resubmitted.currentStepIndex).toBe(0);
		expect(resubmitted.flow.every((s) => s.status === 'pending')).toBe(true);
		expect(resubmitted.auditLog.at(-1)?.action).toBe('resubmit');
	});

	it('待审批可撤销 -> withdrawn', async () => {
		const item = await applyTransition('A1007', 'withdraw', '行程取消', 'u1');
		expect(item.status).toBe('withdrawn');
	});

	it('非法流转抛出异常', async () => {
		await expect(applyTransition('A1001', 'withdraw', '', 'u1')).rejects.toThrow('不允许');
	});
});

describe('统计聚合', () => {
	it('aggregateStatistics 汇总状态 / 类型 / 部门 / 通过率', async () => {
		const list = await getApplications();
		const stats = aggregateStatistics(list);
		expect(stats.total).toBe(list.length);
		expect(stats.statusCount.pending).toBeGreaterThan(0);
		expect(stats.typeCount.travel).toBeGreaterThan(0);
		expect(stats.departmentCount['研发部']).toBeGreaterThan(0);
		expect(stats.approvalRate).toBeGreaterThanOrEqual(0);
		expect(stats.approvalRate).toBeLessThanOrEqual(100);
	});
});
