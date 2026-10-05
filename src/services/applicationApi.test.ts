import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	__resetDb,
	__setNetworkDelay,
	applyTransition,
	aggregateStatistics,
	createApplication,
	getApplicationById,
	getApplications,
	getUserById,
	updateApplicationFields,
	users,
	type CreateApplicationInput
} from './applicationApi';
import { APPROVER_NAME_BY_ROLE, APPLICATION_TYPES, FLOW_BY_TYPE } from '../config/schemas';
import { allowedActions } from '../machine/stateMachine';
import type { ApplicationItem, ApplicationStatus, FieldValue, TransitionAction } from '../types';

const ALL_ACTIONS: TransitionAction[] = ['submit', 'approve', 'reject', 'withdraw'];
const SEED_COUNT = 9;

const travelInput: CreateApplicationInput = {
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
};

function makeItem(partial: Partial<ApplicationItem>): ApplicationItem {
	return {
		id: 'x1',
		type: 'travel',
		applicantId: 'u1',
		applicantName: '张三',
		department: '研发部',
		fields: { amount: 0 },
		status: 'pending',
		flow: [],
		currentStepIndex: 0,
		auditLog: [],
		createTime: '2026-01-01T00:00:00.000Z',
		updateTime: '2026-01-01T00:00:00.000Z',
		...partial
	};
}

beforeEach(() => {
	__resetDb();
	__setNetworkDelay(0);
	vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
	__setNetworkDelay(250);
	vi.restoreAllMocks();
});

describe('用户查询', () => {
	it('getUserById 返回用户，未知 id 为 undefined', () => {
		expect(getUserById('u1')?.name).toBe('张三');
		expect(getUserById('nobody')).toBeUndefined();
	});

	it('空字符串 / 大小写不匹配的 id 视为未登录', () => {
		expect(getUserById('')).toBeUndefined();
		expect(getUserById('U1')).toBeUndefined();
		expect(getUserById(' u1 ')).toBeUndefined();
	});

	it('种子用户 id 唯一且覆盖申请人与审批人两种角色', () => {
		const ids = users.map((u) => u.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(users.some((u) => u.role === 'applicant')).toBe(true);
		expect(users.some((u) => u.role === 'approver')).toBe(true);
		expect(users.every((u) => u.name && u.department)).toBe(true);
	});
});

describe('申请查询', () => {
	it('getApplications 返回按创建时间倒序的列表', async () => {
		const list = await getApplications();
		expect(list.length).toBe(SEED_COUNT);
		const times = list.map((i) => i.createTime);
		expect(times).toEqual([...times].sort().reverse());
	});

	it('getApplicationById 能查到 mock 里的单据，不存在返回 null', async () => {
		const item = await getApplicationById('A1001');
		expect(item?.applicantName).toBe('张三');
		expect(await getApplicationById('NOPE')).toBeNull();
		expect(await getApplicationById('')).toBeNull();
	});

	it('返回的是深拷贝，改动返回值不会污染数据源', async () => {
		const list = await getApplications();
		const target = list[0];
		target.status = 'rejected';
		target.fields.amount = -1;

		const fresh = await getApplicationById(target.id);
		expect(fresh?.status).not.toBe('rejected');
		expect(fresh?.fields.amount).not.toBe(-1);
	});
});

describe('新建申请', () => {
	it('提交新建 -> 状态 pending 且审批链从第 0 步开始', async () => {
		const created = await createApplication(travelInput);
		expect(created.status).toBe('pending');
		expect(created.currentStepIndex).toBe(0);
		expect(created.flow.length).toBe(2);
		expect(created.auditLog.map((l) => l.action)).toEqual(['submit']);
		expect((await getApplications()).length).toBe(SEED_COUNT + 1);
	});

	it('存为草稿 -> 状态 draft 且无操作记录', async () => {
		const created = await createApplication({ ...travelInput, submitNow: false });
		expect(created.status).toBe('draft');
		expect(created.auditLog).toEqual([]);
		expect(created.flow.every((s) => s.status === 'pending')).toBe(true);
	});

	it('申请人不存在时抛错且不落库', async () => {
		await expect(createApplication({ ...travelInput, applicantId: 'ghost' })).rejects.toThrow(
			'申请人不存在'
		);
		await expect(createApplication({ ...travelInput, applicantId: '' })).rejects.toThrow(
			'申请人不存在'
		);
		expect((await getApplications()).length).toBe(SEED_COUNT);
	});

	it('申请人信息取自用户表，不信任调用方传入的其它字段', async () => {
		const created = await createApplication({ ...travelInput, applicantId: 'u3' });
		expect(created.applicantName).toBe('王五');
		expect(created.department).toBe('财务部');
	});

	it('入参 fields 被拷贝，外部后续修改不影响已创建单据', async () => {
		const fields = { ...travelInput.fields } as Record<string, FieldValue>;
		const created = await createApplication({ ...travelInput, fields });
		fields.destination = '被外部改写';

		const stored = await getApplicationById(created.id);
		expect(stored?.fields.destination).toBe('广州');
	});

	it('每种申请类型都生成与配置一致的审批链', async () => {
		for (const meta of APPLICATION_TYPES) {
			const created = await createApplication({ ...travelInput, type: meta.key });
			expect(created.flow.map((s) => s.role)).toEqual(FLOW_BY_TYPE[meta.key].map((s) => s.role));
			expect(created.flow.every((s) => s.name === APPROVER_NAME_BY_ROLE[s.role])).toBe(true);
		}
	});

	it('生成的 id 唯一', async () => {
		const a = await createApplication(travelInput);
		const b = await createApplication(travelInput);
		expect(a.id).not.toBe(b.id);
		expect(a.id.startsWith('A')).toBe(true);
	});

	it('草稿提交后才进入 pending，提交时间与创建时间一致', async () => {
		const draft = await createApplication({ ...travelInput, submitNow: false });
		expect(draft.createTime).toBe(draft.updateTime);
		expect(draft.auditLog).toHaveLength(0);
	});
});

describe('更新字段', () => {
	it('只更新 fields 与 updateTime，不改状态 / 审批链 / 操作记录', async () => {
		const before = await getApplicationById('A1003');
		const updated = await updateApplicationFields('A1003', { leaveType: 'personal' });

		expect(updated.status).toBe('rejected');
		expect(updated.flow).toEqual(before?.flow);
		expect(updated.auditLog).toEqual(before?.auditLog);
		expect(updated.currentStepIndex).toBe(before?.currentStepIndex);
		expect(updated.updateTime >= (before?.updateTime ?? '')).toBe(true);
	});

	it('整体替换 fields，未传的字段被清除', async () => {
		const updated = await updateApplicationFields('A1001', { destination: '杭州' });
		expect(updated.fields).toEqual({ destination: '杭州' });
	});

	it('传空对象得到空 fields，不抛错', async () => {
		const updated = await updateApplicationFields('A1001', {});
		expect(updated.fields).toEqual({});
	});

	it('单据不存在时抛错', async () => {
		await expect(updateApplicationFields('NOPE', { a: 1 })).rejects.toThrow('单据不存在');
		await expect(updateApplicationFields('', { a: 1 })).rejects.toThrow('单据不存在');
	});
});

describe('审批流转（多级审批链）', () => {
	it('两级审批：第一级通过后仍为 pending 并推进步骤，第二级通过后才 approved', async () => {
		const first = await applyTransition('A1007', 'approve', '同意', 'u2');
		expect(first.status).toBe('pending');
		expect(first.currentStepIndex).toBe(1);
		expect(first.flow[0].status).toBe('approved');
		expect(first.flow[0].comment).toBe('同意');
		expect(first.flow[0].time).toBeTruthy();

		const second = await applyTransition('A1007', 'approve', '预算内', 'u3');
		expect(second.status).toBe('approved');
		expect(second.currentStepIndex).toBe(1);
		expect(second.flow[1].status).toBe('approved');
		expect(second.auditLog.filter((l) => l.action === 'approve')).toHaveLength(2);
	});

	it('末级通过后 currentStepIndex 不越界', async () => {
		const item = await applyTransition('A1002', 'approve', '同意', 'u3');
		expect(item.status).toBe('approved');
		expect(item.currentStepIndex).toBeLessThan(item.flow.length);
	});

	it('第一级驳回 -> rejected，被驳回步骤标红且后续步骤保持 pending', async () => {
		const item = await applyTransition('A1007', 'reject', '金额过多', 'u2');
		expect(item.status).toBe('rejected');
		expect(item.flow[0].status).toBe('rejected');
		expect(item.flow[1].status).toBe('pending');
		expect(item.auditLog.at(-1)?.action).toBe('reject');
	});

	it('驳回后可修改字段并重新提交，审批链重置', async () => {
		await updateApplicationFields('A1003', { days: 2, reason: '休假两天' });
		const resubmitted = await applyTransition('A1003', 'submit', '', 'u1');
		expect(resubmitted.status).toBe('pending');
		expect(resubmitted.currentStepIndex).toBe(0);
		expect(resubmitted.flow.every((s) => s.status === 'pending')).toBe(true);
		expect(resubmitted.flow.every((s) => s.comment === undefined)).toBe(true);
		expect(resubmitted.auditLog.at(-1)?.action).toBe('resubmit');
	});

	it('草稿首次提交记为 submit 而不是 resubmit', async () => {
		const item = await applyTransition('A1009', 'submit', '提交', 'u2');
		expect(item.status).toBe('pending');
		expect(item.auditLog.at(-1)?.action).toBe('submit');
		expect(item.auditLog).toHaveLength(1);
	});

	it('待审批可撤销 -> withdrawn，且不改动已有审批链状态', async () => {
		await applyTransition('A1007', 'approve', '同意', 'u2');
		const item = await applyTransition('A1007', 'withdraw', '行程取消', 'u1');
		expect(item.status).toBe('withdrawn');
		expect(item.flow[0].status).toBe('approved');
		expect(item.auditLog.at(-1)?.action).toBe('withdraw');
	});

	it('操作人 id 不存在时记录为未知用户，不阻断流程', async () => {
		const item = await applyTransition('A1007', 'approve', '同意', 'ghost');
		expect(item.status).toBe('pending');
		expect(item.auditLog.at(-1)?.operatorName).toBe('未知用户');
	});

	it('单据不存在时抛错', async () => {
		await expect(applyTransition('NOPE', 'approve', '', 'u1')).rejects.toThrow('单据不存在');
		await expect(applyTransition('', 'submit', '', 'u1')).rejects.toThrow('单据不存在');
	});

	it('种子数据中所有非法流转都被拒绝（状态 x 动作矩阵）', async () => {
		const list = await getApplications();
		let rejected = 0;

		for (const item of list) {
			for (const action of ALL_ACTIONS) {
				if (allowedActions(item.status).includes(action)) continue;
				await expect(applyTransition(item.id, action, '', 'u1')).rejects.toThrow('不允许');
				rejected += 1;
			}
		}

		expect(rejected).toBeGreaterThan(0);
	});

	it('非法流转不会污染单据数据', async () => {
		const before = await getApplicationById('A1001');
		await expect(applyTransition('A1001', 'withdraw', '', 'u1')).rejects.toThrow('不允许');
		const after = await getApplicationById('A1001');
		expect(after).toEqual(before);
	});

	it.each([
		['draft', 'A1009'],
		['approved', 'A1001'],
		['withdrawn', 'A1005']
	] as Array<[ApplicationStatus, string]>)('%s 状态为终态后再 approve 抛错', async (_s, id) => {
		await expect(applyTransition(id, 'approve', '再批一次', 'u2')).rejects.toThrow('不允许');
	});
});

describe('统计聚合', () => {
	it('汇总状态 / 类型 / 部门 / 通过率', async () => {
		const list = await getApplications();
		const stats = aggregateStatistics(list);
		const sum = Object.values(stats.statusCount).reduce((a, b) => a + b, 0);

		expect(stats.total).toBe(list.length);
		expect(sum).toBe(list.length);
		expect(stats.typeCount.travel).toBeGreaterThan(0);
		expect(stats.departmentCount['研发部']).toBeGreaterThan(0);
		expect(stats.approvalRate).toBeGreaterThanOrEqual(0);
		expect(stats.approvalRate).toBeLessThanOrEqual(100);
	});

	it('空列表不除零，通过率与月度序列为空', () => {
		const stats = aggregateStatistics([]);
		expect(stats.total).toBe(0);
		expect(stats.approvalRate).toBe(0);
		expect(stats.monthly).toEqual([]);
		expect(stats.amountByType).toEqual({});
		expect(Object.values(stats.statusCount).every((n) => n === 0)).toBe(true);
	});

	it('全部未裁决时通过率为 0', () => {
		const stats = aggregateStatistics([
			makeItem({ id: 'a', status: 'pending' }),
			makeItem({ id: 'b', status: 'draft' })
		]);
		expect(stats.approvalRate).toBe(0);
	});

	it('通过率按四舍五入取整', () => {
		const stats = aggregateStatistics([
			makeItem({ id: 'a', status: 'approved' }),
			makeItem({ id: 'b', status: 'approved' }),
			makeItem({ id: 'c', status: 'rejected' })
		]);
		expect(stats.approvalRate).toBe(67);
	});

	it('月度分布按时间升序', () => {
		const stats = aggregateStatistics([
			makeItem({ id: 'a', createTime: '2026-10-05T00:00:00.000Z' }),
			makeItem({ id: 'b', createTime: '2026-01-05T00:00:00.000Z' }),
			makeItem({ id: 'c', createTime: '2026-02-05T00:00:00.000Z' })
		]);
		expect(stats.monthly.map(([month]) => month)).toEqual(['2026-01', '2026-02', '2026-10']);
	});

	it('金额聚合跳过非法值，请假无金额不计', () => {
		const stats = aggregateStatistics([
			makeItem({ id: 'a', fields: { amount: 100 } }),
			makeItem({ id: 'b', fields: { amount: 'abc' } }),
			makeItem({ id: 'c', type: 'leave', fields: { days: 2 } })
		]);
		expect(stats.amountByType).toEqual({ travel: 100 });
	});

	it('数字字符串金额可参与聚合', () => {
		const stats = aggregateStatistics([makeItem({ fields: { amount: '250.5' } })]);
		expect(stats.amountByType.travel).toBe(250.5);
	});
});

describe('__resetDb', () => {
	it('重置后回到种子数据，新建的单据消失', async () => {
		await createApplication(travelInput);
		expect((await getApplications()).length).toBe(SEED_COUNT + 1);

		__resetDb();
		const restored = await getApplications();
		expect(restored.length).toBe(SEED_COUNT);
		expect(restored.every((i) => i.id.startsWith('A100'))).toBe(true);
	});
});
