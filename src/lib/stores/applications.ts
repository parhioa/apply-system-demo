import { writable } from 'svelte/store';
import type { ApplicationItem, FieldValue, TransitionAction } from '$lib/types';
import {
	applyTransition,
	createApplication,
	getApplications,
	updateApplicationFields,
	type CreateApplicationInput
} from '$lib/services/applicationApi';

export const applications = writable<ApplicationItem[]>([]);
export const loading = writable(false);

export async function loadApplications(): Promise<void> {
	loading.set(true);
	try {
		applications.set(await getApplications());
	} finally {
		loading.set(false);
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
