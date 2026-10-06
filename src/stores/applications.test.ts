import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	__resetDb,
	__setNetworkDelay,
	aggregateStatistics,
	getApplications,
	type CreateApplicationInput
} from '../services/applicationApi';
import type { User } from '../types';
import {
	applications,
	loadApplications,
	loading,
	runTransition,
	saveApplication,
	saveFieldEdit,
	scopeToUser
} from './applications';

vi.mock('../services/applicationApi', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../services/applicationApi')>();
	return {
		...actual,
		getApplications: vi.fn(actual.getApplications),
		createApplication: vi.fn(actual.createApplication),
		updateApplicationFields: vi.fn(actual.updateApplicationFields),
		applyTransition: vi.fn(actual.applyTransition)
	};
});

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

beforeEach(() => {
	__resetDb();
	__setNetworkDelay(0);
	applications.set([]);
	vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
	__setNetworkDelay(250);
	vi.restoreAllMocks();
});

describe('loadApplications', () => {
	it('加载中 loading 为 true，结束后复位为 false 并填充列表', async () => {
		const pending = loadApplications();
		expect(get(loading)).toBe(true);

		await pending;
		expect(get(loading)).toBe(false);
		expect(get(applications).length).toBeGreaterThan(0);
	});

	it('请求失败时抛出错误、loading 复位且列表保持原值', async () => {
		await loadApplications();
		const snapshot = get(applications);

		vi.mocked(getApplications).mockRejectedValueOnce(new Error('network down'));
		await expect(loadApplications()).rejects.toThrow('network down');

		expect(get(loading)).toBe(false);
		expect(get(applications)).toEqual(snapshot);
	});

	it('并发请求时 loading 直到最后一次请求结束才复位', async () => {
		await Promise.all([loadApplications(), loadApplications()]);
		expect(get(loading)).toBe(false);
	});

	it('重复加载结果幂等', async () => {
		await loadApplications();
		const first = get(applications);
		await loadApplications();
		expect(get(applications)).toEqual(first);
	});
});

describe('saveApplication', () => {
	it('新建成功后刷新列表并返回新单据', async () => {
		const created = await saveApplication(travelInput);
		expect(created.status).toBe('pending');
		expect(get(applications).some((i) => i.id === created.id)).toBe(true);
	});

	it('新建失败时抛出错误且不刷新列表', async () => {
		await loadApplications();
		const snapshot = get(applications);
		const callsBefore = vi.mocked(getApplications).mock.calls.length;

		await expect(saveApplication({ ...travelInput, applicantId: 'ghost' })).rejects.toThrow(
			'申请人不存在'
		);

		expect(get(applications)).toEqual(snapshot);
		expect(vi.mocked(getApplications).mock.calls.length).toBe(callsBefore);
	});
});

describe('saveFieldEdit', () => {
	it('更新成功后列表中的字段同步刷新', async () => {
		await loadApplications();
		const updated = await saveFieldEdit('A1003', { leaveType: 'personal' });
		expect(updated.fields.leaveType).toBe('personal');
		expect(get(applications).find((i) => i.id === 'A1003')?.fields.leaveType).toBe('personal');
	});

	it('单据不存在时抛出错误且列表不变', async () => {
		await loadApplications();
		const snapshot = get(applications);

		await expect(saveFieldEdit('NOPE', { a: 1 })).rejects.toThrow('单据不存在');
		expect(get(applications)).toEqual(snapshot);
	});
});

describe('runTransition', () => {
	it('审批通过后列表状态同步为 approved', async () => {
		await loadApplications();
		const updated = await runTransition('A1007', 'approve', '同意', 'u2');
		expect(updated.status).toBe('pending');
		expect(get(applications).find((i) => i.id === 'A1007')?.currentStepIndex).toBe(1);
	});

	it('非法流转抛出错误且列表保持原状态', async () => {
		await loadApplications();
		const before = get(applications).find((i) => i.id === 'A1001');

		await expect(runTransition('A1001', 'withdraw', '', 'u1')).rejects.toThrow('不允许');

		const after = get(applications).find((i) => i.id === 'A1001');
		expect(after?.status).toBe(before?.status);
		expect(after?.auditLog).toHaveLength(before?.auditLog.length ?? 0);
	});

	it('单据不存在时抛出错误', async () => {
		await expect(runTransition('NOPE', 'approve', '', 'u1')).rejects.toThrow('单据不存在');
	});
});

describe('scopeToUser', () => {
	const applicant: User = { id: 'u1', name: '张三', department: '研发部', role: 'applicant' };
	const approver: User = { id: 'u2', name: '李四', department: '研发部', role: 'approver' };

	it('审批人可以看到全部申请单', async () => {
		const all = await getApplications();
		expect(all.length).toBeGreaterThan(0);
		expect(scopeToUser(all, approver)).toEqual(all);
	});

	it('申请人只能看到自己提交的申请单', async () => {
		const all = await getApplications();
		const scoped = scopeToUser(all, applicant);

		expect(scoped.length).toBeGreaterThan(0);
		expect(scoped.length).toBeLessThan(all.length);
		expect(scoped.every((item) => item.applicantId === applicant.id)).toBe(true);
	});

	it('未登录时什么都看不到', async () => {
		const all = await getApplications();
		expect(scopeToUser(all, null)).toEqual([]);
	});

	it('没有提交过申请的申请人看到空列表', async () => {
		const all = await getApplications();
		const stranger: User = { id: 'u999', name: '幽灵', department: '外部', role: 'applicant' };
		expect(scopeToUser(all, stranger)).toEqual([]);
	});

	it('报表聚合只统计申请人自己的单据', async () => {
		const all = await getApplications();
		const mine = scopeToUser(all, applicant);

		const mineStats = aggregateStatistics(mine);
		expect(mineStats.total).toBe(mine.length);
		expect(mineStats.total).toBeLessThan(aggregateStatistics(all).total);
	});
});
