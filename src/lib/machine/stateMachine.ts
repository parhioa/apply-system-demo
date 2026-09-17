import type { ApplicationStatus, TransitionAction } from '$lib/types';

/**
 * 审批状态机定义。
 *
 *   draft     --submit-->   pending --approve--> approved
 *                              |  |--reject-----> rejected   --submit--> pending (重新提交)
 *                              +--withdraw-----> withdrawn
 *
 * approve 在多级审批链中由 service 层逐级推进当前步骤，末级通过时才真正置为 approved。
 */
export const TRANSITIONS: Record<
	ApplicationStatus,
	Partial<Record<TransitionAction, ApplicationStatus>>
> = {
	draft: { submit: 'pending' },
	pending: { approve: 'approved', reject: 'rejected', withdraw: 'withdrawn' },
	rejected: { submit: 'pending' },
	approved: {},
	withdrawn: {}
};

/** 判断某状态下某动作是否合法 */
export function canTransition(from: ApplicationStatus, action: TransitionAction): boolean {
	return action in TRANSITIONS[from];
}

/** 返回动作后的目标状态；不合法时返回 null */
export function nextStatus(
	from: ApplicationStatus,
	action: TransitionAction
): ApplicationStatus | null {
	if (!canTransition(from, action)) return null;
	return TRANSITIONS[from][action] as ApplicationStatus;
}

/** 从状态机派生某状态可执行的动作列表 */
export function allowedActions(from: ApplicationStatus): TransitionAction[] {
	return Object.keys(TRANSITIONS[from]) as TransitionAction[];
}
