import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { currentUser, login, logout } from './auth';
import { getUserById } from '../services/applicationApi';

beforeEach(() => {
	vi.spyOn(console, 'info').mockImplementation(() => {});
	logout();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('登录态 currentUser', () => {
	it('初始为未登录（null）', () => {
		expect(get(currentUser)).toBeNull();
	});

	it('订阅者能收到登录状态变化', () => {
		const seen: Array<string | null> = [];
		const stop = currentUser.subscribe((u) => seen.push(u?.id ?? null));

		login('u1');
		logout();
		stop();

		expect(seen).toEqual([null, 'u1', null]);
	});
});

describe('login', () => {
	it('有效用户 id 登录成功并写入 store', () => {
		expect(login('u1')).toBe(true);
		expect(get(currentUser)?.name).toBe('张三');
		expect(get(currentUser)?.department).toBe('研发部');
		expect(get(currentUser)?.role).toBe('applicant');
	});

	it('审批人登录后角色为 approver', () => {
		expect(login('u2')).toBe(true);
		expect(get(currentUser)?.role).toBe('approver');
	});

	it('用户 id 不存在时登录失败并返回 false，登录态保持未登录', () => {
		expect(login('ghost')).toBe(false);
		expect(get(currentUser)).toBeNull();
	});

	it('空字符串 / 空白 / 大小写不匹配的 id 均登录失败', () => {
		expect(login('')).toBe(false);
		expect(login(' ')).toBe(false);
		expect(login('U1')).toBe(false);
		expect(get(currentUser)).toBeNull();
	});

	it('登录失败不会覆盖或清空已登录的用户', () => {
		login('u1');
		expect(login('ghost')).toBe(false);
		expect(get(currentUser)?.id).toBe('u1');
	});

	it('重复登录以最后一次为准', () => {
		login('u1');
		expect(login('u3')).toBe(true);
		expect(get(currentUser)?.id).toBe('u3');
		expect(get(currentUser)?.department).toBe('财务部');
	});

	it('写入 store 的用户与用户表中的对象一致', () => {
		login('u3');
		expect(get(currentUser)).toBe(getUserById('u3'));
	});
});

describe('logout', () => {
	it('退出后登录态清空', () => {
		login('u1');
		logout();
		expect(get(currentUser)).toBeNull();
	});

	it('未登录时退出是幂等的，不抛错', () => {
		expect(() => {
			logout();
			logout();
		}).not.toThrow();
		expect(get(currentUser)).toBeNull();
	});

	it('退出后可用同一账号重新登录', () => {
		login('u1');
		logout();
		expect(login('u1')).toBe(true);
		expect(get(currentUser)?.id).toBe('u1');
	});
});
