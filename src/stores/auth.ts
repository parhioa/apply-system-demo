import { writable } from 'svelte/store';
import type { User } from '../types';
import { getUserById } from '../services/applicationApi';

export const currentUser = writable<User | null>(null);

export function login(userId: string): boolean {
	const user = getUserById(userId);
	if (!user) return false;
	currentUser.set(user);
	console.info(`[auth] ${user.name}（${user.department}）已登录`);
	return true;
}

export function logout(): void {
	currentUser.set(null);
	console.info('[auth] 已退出登录');
}
