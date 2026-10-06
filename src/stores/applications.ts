import { writable } from 'svelte/store';
import type { ApplicationItem, FieldValue, TransitionAction, User } from '../types';
import {
	applyTransition,
	createApplication,
	getApplications,
	updateApplicationFields,
	type CreateApplicationInput
} from '../services/applicationApi';

export const applications = writable<ApplicationItem[]>([]);
export const loading = writable(false);

/** 数据可见范围：审批人看全部，申请人只看自己提交的，未登录什么都看不到 */
export function scopeToUser(list: ApplicationItem[], user: User | null): ApplicationItem[] {
	if (!user) return [];
	if (user.role === 'approver') return list;
	return list.filter((item) => item.applicantId === user.id);
}

/** 并发请求计数：只有全部请求结束才置为不加载，避免竞态提前熄灭 loading */
let pendingCount = 0;

export async function loadApplications(): Promise<void> {
	pendingCount += 1;
	loading.set(true);
	try {
		applications.set(await getApplications());
	} finally {
		pendingCount -= 1;
		if (pendingCount === 0) loading.set(false);
	}
}

export async function saveApplication(input: CreateApplicationInput): Promise<ApplicationItem> {
	const created = await createApplication(input);
	await loadApplications();
	return created;
}

export async function saveFieldEdit(
	id: string,
	fields: Record<string, FieldValue>
): Promise<ApplicationItem> {
	const updated = await updateApplicationFields(id, fields);
	await loadApplications();
	return updated;
}

export async function runTransition(
	id: string,
	action: TransitionAction,
	comment: string,
	operatorId: string
): Promise<ApplicationItem> {
	const updated = await applyTransition(id, action, comment, operatorId);
	await loadApplications();
	return updated;
}
