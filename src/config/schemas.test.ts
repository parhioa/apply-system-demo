import { describe, expect, it } from 'vitest';
import {
	ACTION_META,
	APPROVER_NAME_BY_ROLE,
	APPLICATION_TYPES,
	FIELD_SCHEMAS,
	FLOW_BY_TYPE,
	STATUS_META,
	getApplicationTypeMeta,
	getFieldSchemas
} from './schemas';
import type { ApplicationStatus, ApplicationType, AuditAction, TransitionAction } from '../types';

const ALL_STATUSES: ApplicationStatus[] = ['draft', 'pending', 'approved', 'rejected', 'withdrawn'];
const ALL_TRANSITION_ACTIONS: TransitionAction[] = ['submit', 'approve', 'reject', 'withdraw'];
const ALL_AUDIT_ACTIONS: AuditAction[] = ['submit', 'resubmit', 'approve', 'reject', 'withdraw'];
const ALL_TYPES = APPLICATION_TYPES.map((t) => t.key);

describe('APPLICATION_TYPES', () => {
	it('覆盖差旅 / 培训 / 请假三类且 key 唯一', () => {
		expect(ALL_TYPES).toEqual(['travel', 'training', 'leave']);
		expect(new Set(ALL_TYPES).size).toBe(ALL_TYPES.length);
	});

	it('每种类型都有展示名与描述', () => {
		expect(APPLICATION_TYPES.every((t) => t.label.length > 0 && t.description.length > 0)).toBe(
			true
		);
	});
});

describe('getApplicationTypeMeta', () => {
	it('已知类型返回对应元信息', () => {
		expect(getApplicationTypeMeta('travel').label).toBe('差旅申请');
		expect(getApplicationTypeMeta('training').label).toBe('培训申请');
		expect(getApplicationTypeMeta('leave').label).toBe('请假申请');
	});

	it('未知类型兜底返回第一个类型而不是抛错', () => {
		expect(getApplicationTypeMeta('unknown' as ApplicationType)).toBe(APPLICATION_TYPES[0]);
	});
});

describe('FIELD_SCHEMAS', () => {
	it('每种申请类型都配置了字段', () => {
		for (const type of ALL_TYPES) {
			expect(getFieldSchemas(type).length).toBeGreaterThan(0);
			expect(getFieldSchemas(type)).toBe(FIELD_SCHEMAS[type]);
		}
	});

	it('同一类型内字段 name 不重复', () => {
		for (const type of ALL_TYPES) {
			const names = getFieldSchemas(type).map((s) => s.name);
			expect(new Set(names).size).toBe(names.length);
		}
	});

	it('必填字段有中文 label 与合法类型', () => {
		for (const type of ALL_TYPES) {
			for (const schema of getFieldSchemas(type)) {
				expect(schema.label.length).toBeGreaterThan(0);
				expect(['text', 'textarea', 'number', 'date', 'select']).toContain(schema.type);
			}
		}
	});

	it('select 字段必须配置候选项', () => {
		for (const type of ALL_TYPES) {
			for (const schema of getFieldSchemas(type).filter((s) => s.type === 'select')) {
				expect(schema.options?.length).toBeGreaterThan(0);
				const values = schema.options?.map((o) => o.value) ?? [];
				expect(new Set(values).size).toBe(values.length);
			}
		}
	});

	it('number 字段的 min 不为负，max 大于 min', () => {
		for (const type of ALL_TYPES) {
			for (const schema of getFieldSchemas(type).filter((s) => s.type === 'number')) {
				expect(schema.min ?? 0).toBeGreaterThanOrEqual(0);
				if (schema.max !== undefined) {
					expect(schema.max).toBeGreaterThan(schema.min ?? 0);
				}
			}
		}
	});

	it('三种类型都要求填写事由或说明类字段之外的开始 / 结束日期', () => {
		for (const type of ALL_TYPES) {
			const names = getFieldSchemas(type).map((s) => s.name);
			expect(names).toContain('startDate');
			expect(names).toContain('endDate');
		}
	});
});

describe('FLOW_BY_TYPE', () => {
	it('每种申请类型都配置了审批链', () => {
		for (const type of ALL_TYPES) {
			expect(FLOW_BY_TYPE[type].length).toBeGreaterThan(0);
		}
	});

	it('每个审批环节都能查到审批人姓名', () => {
		for (const type of ALL_TYPES) {
			for (const step of FLOW_BY_TYPE[type]) {
				expect(APPROVER_NAME_BY_ROLE[step.role]).toBeTruthy();
			}
		}
	});

	it('审批链中的角色不重复', () => {
		for (const type of ALL_TYPES) {
			const roles = FLOW_BY_TYPE[type].map((s) => s.role);
			expect(new Set(roles).size).toBe(roles.length);
		}
	});
});

describe('展示元信息', () => {
	it('STATUS_META 覆盖全部状态，新增状态时测试会失败提醒补 meta', () => {
		expect(Object.keys(STATUS_META).sort()).toEqual([...ALL_STATUSES].sort());
		for (const status of ALL_STATUSES) {
			expect(STATUS_META[status].label.length).toBeGreaterThan(0);
		}
	});

	it('ACTION_META 覆盖全部流转动作与操作记录动作', () => {
		for (const action of ALL_TRANSITION_ACTIONS) {
			expect(ACTION_META[action]).toBeDefined();
		}
		for (const action of ALL_AUDIT_ACTIONS) {
			expect(ACTION_META[action]).toBeDefined();
		}
	});
});
