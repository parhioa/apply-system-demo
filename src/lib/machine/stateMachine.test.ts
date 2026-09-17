import { describe, expect, it } from 'vitest';
import { allowedActions, canTransition, nextStatus } from './stateMachine';

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
