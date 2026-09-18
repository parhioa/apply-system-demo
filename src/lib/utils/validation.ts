import type { ApplicationItem, FieldSchema, FieldValue } from '$lib/types';

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
	return errors;
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
