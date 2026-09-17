import { describe, expect, it } from 'vitest';
import { FIELD_SCHEMAS } from '$lib/config/schemas';
import { amountOf, summaryOf, validateField, validateFields } from './validation';
import type { ApplicationItem } from '$lib/types';

const travelSchemas = FIELD_SCHEMAS.travel;

function createItem(partial: Partial<ApplicationItem>): ApplicationItem {
	return {
		id: 't1',
		type: 'travel',
		applicantId: 'u1',
		applicantName: '张三',
		department: '研发部',
		fields: { destination: '上海', amount: 1200 },
		status: 'pending',
		flow: [],
		currentStepIndex: 0,
		auditLog: [],
		createTime: '2026-09-01T00:00:00.000Z',
		updateTime: '2026-09-01T00:00:00.000Z',
		...partial
	};
}

describe('validateField', () => {
	it('必填字段为空返回错误', () => {
		const schema = travelSchemas.find((s) => s.name === 'destination')!;
		expect(validateField(schema, '')).toContain('请填写');
		expect(validateField(schema, undefined)).toContain('请填写');
	});

	it('必填字段填了内容通过校验', () => {
		const schema = travelSchemas.find((s) => s.name === 'destination')!;
		expect(validateField(schema, '上海')).toBeNull();
	});

	it('number 类型校验非法值与范围', () => {
		const amount = travelSchemas.find((s) => s.name === 'amount')!;
		expect(validateField(amount, 'abc')).toContain('必须是数字');
		expect(validateField(amount, 0)).toContain('不能小于');
		expect(validateField(amount, 3000)).toBeNull();
	});

	it('date 类型校验格式', () => {
		const date = travelSchemas.find((s) => s.name === 'startDate')!;
		expect(validateField(date, '2026/09/01')).toContain('格式不正确');
		expect(validateField(date, '2026-09-01')).toBeNull();
	});
});

describe('validateFields', () => {
	it('返回错误字段映射，只包含有问题的字段', () => {
		const errors = validateFields(travelSchemas, {
			destination: '',
			amount: 500,
			reason: '出差'
		});
		expect(errors.destination).toBeDefined();
		expect(errors.amount).toBeUndefined();
		expect(errors.startDate).toBeDefined(); // 缺不缺
	});
});

describe('summaryOf / amountOf / typeLabelOf', () => {
	it('差旅摘要包含目的地', () => {
		expect(summaryOf(createItem({}))).toContain('上海');
	});

	it('金额从 fields.amount 取值，请假返回 0', () => {
		expect(amountOf(createItem({}))).toBe(1200);
		expect(amountOf(createItem({ type: 'leave', fields: {} }))).toBe(0);
	});
});
