import type { ApplicationItem, FieldSchema, FieldValue } from '../types';

/** 校验单个字段，返回错误信息，通过返回 null */
export function validateField(schema: FieldSchema, value: FieldValue | undefined): string | null {
	const empty = value === undefined || value === null || value === '';

	if (schema.required && empty) {
		return `请填写${schema.label}`;
	}
	if (empty) {
		return null;
	}

	switch (schema.type) {
		case 'number': {
			const n = typeof value === 'number' ? value : Number(value);
			if (!Number.isFinite(n)) return `${schema.label}必须是数字`;
			if (schema.min !== undefined && n < schema.min)
				return `${schema.label}不能小于 ${schema.min}`;
			if (schema.max !== undefined && n > schema.max)
				return `${schema.label}不能大于 ${schema.max}`;
			return null;
		}
		case 'date': {
			const s = String(value);
			if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${schema.label}格式不正确`;
			return null;
		}
		default:
			return null;
	}
}

/** 跨字段校验：date 字段声明了 after 时，不得早于参照字段。返回 { 字段key: 错误信息 } */
export function validateCrossFields(
	schemas: FieldSchema[],
	values: Record<string, FieldValue>,
	/** 单字段校验已有的错误：这些字段不再重复报顺序问题 */
	reserved: Record<string, string> = {}
): Record<string, string> {
	const errors: Record<string, string> = {};
	const byName = new Map(schemas.map((schema) => [schema.name, schema]));

	for (const schema of schemas) {
		if (schema.type !== 'date' || !schema.after || reserved[schema.name]) continue;

		const base = byName.get(schema.after);
		if (!base || base.type !== 'date' || reserved[base.name]) continue;

		const value = values[schema.name];
		const baseValue = values[base.name];
		if (value === undefined || value === '' || baseValue === undefined || baseValue === '') {
			continue;
		}
		// yyyy-MM-dd 字符串天然可按字典序比较，格式已由 validateField 保证
		if (String(value) < String(baseValue)) {
			errors[schema.name] = `${schema.label}不能早于${base.label}`;
		}
	}
	return errors;
}

/** 校验一组字段，返回 { 字段key: 错误信息 } */
export function validateFields(
	schemas: FieldSchema[],
	values: Record<string, FieldValue>
): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const schema of schemas) {
		const error = validateField(schema, values[schema.name]);
		if (error) errors[schema.name] = error;
	}
	return { ...errors, ...validateCrossFields(schemas, values, errors) };
}

/** 列表页展示用的摘要 */
export function summaryOf(item: ApplicationItem): string {
	switch (item.type) {
		case 'travel':
			return `出差 ${String(item.fields.destination ?? '')}`;
		case 'training':
			return `参加 ${String(item.fields.courseName ?? '')}`;
		case 'leave': {
			const value = String(item.fields.leaveType ?? '');
			const labels: Record<string, string> = { personal: '事假', sick: '病假', annual: '年假' };
			return `${labels[value] ?? value} ${item.fields.days ?? ''} 天`;
		}
	}
}

/** 金额：差旅/培训取 amount，请假为 0 */
export function amountOf(item: ApplicationItem): number {
	const n = Number(item.fields.amount);
	return Number.isFinite(n) ? n : 0;
}

/** 时间戳格式化为日期（yyyy-MM-dd） */
export function formatTime(iso: string): string {
	return iso.slice(0, 10);
}
