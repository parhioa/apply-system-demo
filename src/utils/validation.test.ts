import { describe, expect, it } from 'vitest';
import { FIELD_SCHEMAS } from '../config/schemas';
import {
	amountOf,
	formatTime,
	summaryOf,
	validateCrossFields,
	validateField,
	validateFields
} from './validation';
import type { ApplicationItem } from '../types';

const travelSchemas = FIELD_SCHEMAS.travel;

function schemaOf(type: keyof typeof FIELD_SCHEMAS, name: string) {
	const schema = FIELD_SCHEMAS[type].find((s) => s.name === name);
	if (!schema) throw new Error(`schema 不存在: ${type}.${name}`);
	return schema;
}

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
		const schema = schemaOf('travel', 'destination');
		expect(validateField(schema, '')).toContain('请填写');
		expect(validateField(schema, undefined)).toContain('请填写');
		expect(validateField(schema, null as unknown as string)).toContain('请填写');
	});

	it('必填字段填了内容通过校验', () => {
		expect(validateField(schemaOf('travel', 'destination'), '上海')).toBeNull();
	});

	it('非必填字段为空视为通过', () => {
		expect(validateField(schemaOf('training', 'reason'), '')).toBeNull();
		expect(validateField(schemaOf('training', 'reason'), undefined)).toBeNull();
	});

	it('只有空格的文本视为已填写（不额外 trim）', () => {
		expect(validateField(schemaOf('travel', 'destination'), '   ')).toBeNull();
	});

	it('number 类型校验非法值与范围', () => {
		const amount = schemaOf('travel', 'amount');
		expect(validateField(amount, 'abc')).toContain('必须是数字');
		expect(validateField(amount, 0)).toContain('不能小于');
		expect(validateField(amount, 3000)).toBeNull();
	});

	it('number 类型支持数字字符串，边界值取闭区间', () => {
		const amount = schemaOf('travel', 'amount');
		const days = schemaOf('leave', 'days');

		expect(validateField(amount, '800')).toBeNull();
		expect(validateField(amount, 1)).toBeNull();
		expect(validateField(days, 0.5)).toBeNull();
		expect(validateField(days, 365)).toBeNull();
		expect(validateField(days, 365.5)).toContain('不能大于');
		expect(validateField(days, 0.4)).toContain('不能小于');
	});

	it('number 类型拒绝 NaN / Infinity', () => {
		const amount = schemaOf('travel', 'amount');
		expect(validateField(amount, Number.NaN)).toContain('必须是数字');
		expect(validateField(amount, Number.POSITIVE_INFINITY)).toContain('必须是数字');
	});

	it('date 类型校验格式', () => {
		const date = schemaOf('travel', 'startDate');
		expect(validateField(date, '2026/09/01')).toContain('格式不正确');
		expect(validateField(date, '2026-9-1')).toContain('格式不正确');
		expect(validateField(date, '2026-09-01')).toBeNull();
	});

	it('text / textarea / select 类型不做额外格式校验', () => {
		expect(validateField(schemaOf('travel', 'destination'), '任意文本')).toBeNull();
		expect(validateField(schemaOf('travel', 'reason'), '多行\n文本')).toBeNull();
		expect(validateField(schemaOf('travel', 'transportation'), 'flight')).toBeNull();
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
		expect(errors.startDate).toBeDefined();
	});

	it('全部字段合法时返回空对象', () => {
		const errors = validateFields(travelSchemas, {
			destination: '上海',
			startDate: '2026-10-01',
			endDate: '2026-10-03',
			transportation: 'flight',
			amount: 100,
			reason: '拜访客户'
		});
		expect(errors).toEqual({});
	});

	it('空 values 时必填字段全部报错，非必填字段不报错', () => {
		const errors = validateFields(FIELD_SCHEMAS.training, {});
		expect(errors.courseName).toBeDefined();
		expect(errors.amount).toBeDefined();
		expect(errors.reason).toBeUndefined();
	});

	it('多个字段同时非法时都能被收集', () => {
		const errors = validateFields(travelSchemas, {
			destination: '',
			startDate: '2026/10/01',
			endDate: '',
			transportation: '',
			amount: 'abc',
			reason: ''
		});
		expect(Object.keys(errors).sort()).toEqual([
			'amount',
			'destination',
			'endDate',
			'reason',
			'startDate',
			'transportation'
		]);
	});

	it('values 中的多余字段不影响校验结果', () => {
		const errors = validateFields([{ name: 'a', label: 'A', type: 'text', required: true }], {
			a: 'ok',
			extra: 'ignored'
		});
		expect(errors).toEqual({});
	});
});

describe('validateCrossFields', () => {
	it('三种申请类型的结束日期早于开始日期都会报错', () => {
		for (const type of ['travel', 'training', 'leave'] as const) {
			const errors = validateCrossFields(FIELD_SCHEMAS[type], {
				startDate: '2026-10-05',
				endDate: '2026-10-03'
			});
			expect(errors).toEqual({ endDate: '结束日期不能早于开始日期' });
		}
	});

	it('结束日期等于开始日期通过（当天往返 / 1 天假）', () => {
		const errors = validateCrossFields(travelSchemas, {
			startDate: '2026-10-05',
			endDate: '2026-10-05'
		});
		expect(errors).toEqual({});
	});

	it('结束日期晚于开始日期通过', () => {
		const errors = validateCrossFields(travelSchemas, {
			startDate: '2026-10-01',
			endDate: '2026-10-03'
		});
		expect(errors).toEqual({});
	});

	it('任一端为空时跳过顺序校验，交给必填规则', () => {
		expect(validateCrossFields(travelSchemas, { startDate: '', endDate: '2026-10-03' })).toEqual(
			{}
		);
		expect(validateCrossFields(travelSchemas, { startDate: '2026-10-03', endDate: '' })).toEqual(
			{}
		);
	});

	it('参照字段已有单字段错误时跳过，不重复报顺序问题', () => {
		const errors = validateCrossFields(
			travelSchemas,
			{ startDate: '2026/10/05', endDate: '2026-10-03' },
			{ startDate: '开始日期格式不正确' }
		);
		expect(errors).toEqual({});
	});

	it('validateFields 同时返回单字段错误与跨字段错误', () => {
		const errors = validateFields(travelSchemas, {
			destination: '',
			startDate: '2026-10-05',
			endDate: '2026-10-03',
			transportation: 'flight',
			amount: 100,
			reason: '拜访客户'
		});
		expect(errors.destination).toContain('请填写');
		expect(errors.endDate).toBe('结束日期不能早于开始日期');
	});
});

describe('summaryOf', () => {
	it('差旅摘要包含目的地', () => {
		expect(summaryOf(createItem({}))).toContain('上海');
	});

	it('培训摘要包含课程名', () => {
		const item = createItem({ type: 'training', fields: { courseName: '架构课' } });
		expect(summaryOf(item)).toContain('架构课');
	});

	it('请假摘要映射中文类型与天数', () => {
		const item = createItem({ type: 'leave', fields: { leaveType: 'annual', days: 3 } });
		expect(summaryOf(item)).toBe('年假 3 天');
	});

	it('请假类型未知时原样展示，不抛错', () => {
		const item = createItem({ type: 'leave', fields: { leaveType: 'marriage', days: 1 } });
		expect(summaryOf(item)).toContain('marriage');
	});

	it('字段缺失时返回空摘要而不是 undefined', () => {
		expect(summaryOf(createItem({ fields: {} }))).toBe('出差 ');
		expect(typeof summaryOf(createItem({ fields: {} }))).toBe('string');
	});
});

describe('amountOf', () => {
	it('金额从 fields.amount 取值，请假返回 0', () => {
		expect(amountOf(createItem({}))).toBe(1200);
		expect(amountOf(createItem({ type: 'leave', fields: {} }))).toBe(0);
	});

	it('金额为数字字符串时正常解析，非法值归零', () => {
		expect(amountOf(createItem({ fields: { amount: '800' } }))).toBe(800);
		expect(amountOf(createItem({ fields: { amount: 'abc' } }))).toBe(0);
		expect(amountOf(createItem({ fields: { amount: null as unknown as number } }))).toBe(0);
	});

	it('金额为 0 时返回 0（不是 NaN）', () => {
		expect(amountOf(createItem({ fields: { amount: 0 } }))).toBe(0);
	});
});

describe('formatTime', () => {
	it('截取日期部分', () => {
		expect(formatTime('2026-09-01T12:34:56.000Z')).toBe('2026-09-01');
	});

	it('已经是日期字符串时原样返回', () => {
		expect(formatTime('2026-09-01')).toBe('2026-09-01');
	});

	it('空字符串返回空字符串而不抛错', () => {
		expect(formatTime('')).toBe('');
	});
});
