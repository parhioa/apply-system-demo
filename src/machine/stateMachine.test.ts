import { describe, expect, it } from 'vitest';
import { TRANSITIONS, allowedActions, canTransition, nextStatus } from './stateMachine';
import type { ApplicationStatus, TransitionAction } from '../types';

const ALL_STATUSES: ApplicationStatus[] = ['draft', 'pending', 'approved', 'rejected', 'withdrawn'];
const ALL_ACTIONS: TransitionAction[] = ['submit', 'approve', 'reject', 'withdraw'];

describe('审批状态机', () => {
	it('draft 只能 submit 到 pending', () => {
		expect(canTransition('draft', 'submit')).toBe(true);
		expect(nextStatus('draft', 'submit')).toBe('pending');
		expect(canTransition('draft', 'approve')).toBe(false);
		expect(nextStatus('draft', 'reject')).toBeNull();
	});

	it('pending 可 approve / reject / withdraw', () => {
		expect(canTransition('pending', 'approve')).toBe(true);
		expect(nextStatus('pending', 'approve')).toBe('approved');
		expect(nextStatus('pending', 'reject')).toBe('rejected');
		expect(nextStatus('pending', 'withdraw')).toBe('withdrawn');
	});

	it('rejected 可重新 submit 回到 pending', () => {
		expect(canTransition('rejected', 'submit')).toBe(true);
		expect(nextStatus('rejected', 'submit')).toBe('pending');
		expect(canTransition('rejected', 'approve')).toBe(false);
	});

	it('approved 与 withdrawn 为终态，不再有任何动作', () => {
		expect(allowedActions('approved')).toEqual([]);
		expect(allowedActions('withdrawn')).toEqual([]);
		expect(canTransition('approved', 'submit')).toBe(false);
		expect(nextStatus('withdrawn', 'submit')).toBeNull();
	});

	it('allowedActions 返回当前状态可执行的动作列表', () => {
		expect(allowedActions('pending')).toEqual(['approve', 'reject', 'withdraw']);
		expect(allowedActions('draft')).toEqual(['submit']);
		expect(allowedActions('rejected')).toEqual(['submit']);
	});
});

describe('状态机边界', () => {
	it('转移表覆盖全部状态，新增状态时测试会失败提醒补定义', () => {
		expect(Object.keys(TRANSITIONS).sort()).toEqual([...ALL_STATUSES].sort());
	});

	it('转移表的目标状态都是合法状态', () => {
		for (const status of ALL_STATUSES) {
			for (const target of Object.values(TRANSITIONS[status])) {
				expect(ALL_STATUSES).toContain(target);
			}
		}
	});

	it('canTransition 与 nextStatus 结论一致：合法时都有目标状态', () => {
		for (const status of ALL_STATUSES) {
			for (const action of ALL_ACTIONS) {
				const legal = canTransition(status, action);
				expect(nextStatus(status, action) !== null).toBe(legal);
				expect(allowedActions(status).includes(action)).toBe(legal);
			}
		}
	});

	it('未知状态不抛异常，一律视为不可流转', () => {
		const unknown = 'archived' as ApplicationStatus;
		expect(canTransition(unknown, 'submit')).toBe(false);
		expect(nextStatus(unknown, 'submit')).toBeNull();
		expect(allowedActions(unknown)).toEqual([]);
	});

	it('未知动作视为不合法', () => {
		const unknown = 'archive' as TransitionAction;
		expect(canTransition('pending', unknown)).toBe(false);
		expect(nextStatus('pending', unknown)).toBeNull();
	});

	it('没有自环状态：一次流转后不会回到同一状态', () => {
		for (const status of ALL_STATUSES) {
			for (const action of ALL_ACTIONS) {
				expect(nextStatus(status, action)).not.toBe(status);
			}
		}
	});

	it('终态不可再流转到任何状态', () => {
		for (const terminal of ['approved', 'withdrawn'] as ApplicationStatus[]) {
			for (const action of ALL_ACTIONS) {
				expect(nextStatus(terminal, action)).toBeNull();
			}
		}
	});
});
