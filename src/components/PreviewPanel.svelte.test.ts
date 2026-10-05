import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import PreviewPanel from './PreviewPanel.svelte';
import { FIELD_SCHEMAS } from '../config/schemas';
import type { FieldValue } from '../types';

const travelSchemas = FIELD_SCHEMAS.travel;
const values: Record<string, FieldValue> = {
	destination: '上海',
	startDate: '2026-10-01',
	endDate: '2026-10-03',
	transportation: 'train',
	amount: 800,
	reason: '客户拜访'
};

describe('PreviewPanel.svelte', () => {
	it('展示各字段的值，select 显示中文选项', () => {
		render(PreviewPanel, { schemas: travelSchemas, values });
		expect(screen.getByText('上海')).toBeTruthy();
		expect(screen.getByText('高铁')).toBeTruthy();
		expect(screen.getByText('800')).toBeTruthy();
	});

	it('日期字段原样展示', () => {
		render(PreviewPanel, { schemas: travelSchemas, values });
		expect(screen.getByText('2026-10-01')).toBeTruthy();
		expect(screen.getByText('2026-10-03')).toBeTruthy();
	});

	it('点击有错误的字段行触发 onjump 并可看到错误信息', async () => {
		const onjump = vi.fn();
		render(PreviewPanel, {
			schemas: travelSchemas,
			values,
			errors: { destination: '请填写出差目的地' },
			onjump
		});

		expect(screen.getByText('请填写出差目的地')).toBeTruthy();
		await fireEvent.click(screen.getByText('请填写出差目的地'));
		expect(onjump).toHaveBeenCalledWith('destination');
	});

	it('点击无错误字段行也可跳回表单', async () => {
		const onjump = vi.fn();
		render(PreviewPanel, { schemas: travelSchemas, values, onjump });

		await fireEvent.click(screen.getByText('800'));
		expect(onjump).toHaveBeenCalledWith('amount');
	});

	it('整行都可点击并带上字段名', async () => {
		const onjump = vi.fn();
		render(PreviewPanel, { schemas: travelSchemas, values, onjump });

		await fireEvent.click(screen.getByLabelText('出差目的地'));
		expect(onjump).toHaveBeenCalledWith('destination');
	});

	it('空值渲染占位符 —', () => {
		render(PreviewPanel, { schemas: travelSchemas, values: {} });
		expect(screen.getAllByText('—').length).toBeGreaterThan(0);
	});

	it('数值 0 展示为 0 而不是占位符', () => {
		render(PreviewPanel, { schemas: travelSchemas, values: { amount: 0 } });
		expect(screen.getByText('0')).toBeTruthy();
	});

	it('select 值不在候选项内时原样展示', () => {
		render(PreviewPanel, { schemas: travelSchemas, values: { transportation: 'spaceship' } });
		expect(screen.getByText('spaceship')).toBeTruthy();
	});

	it('有错误时该行操作文案变为去修改，其余行仍为修改', () => {
		render(PreviewPanel, {
			schemas: travelSchemas,
			values,
			errors: { destination: '请填写出差目的地' }
		});
		expect(screen.getByText('去修改')).toBeTruthy();
		expect(screen.getAllByText('修改')).toHaveLength(travelSchemas.length - 1);
	});

	it('无错误时操作文案为修改', () => {
		render(PreviewPanel, { schemas: travelSchemas, values });
		expect(screen.getAllByText('修改').length).toBe(travelSchemas.length);
	});

	it('未传 errors / onjump 时渲染与点击都不报错', async () => {
		render(PreviewPanel, { schemas: travelSchemas, values });
		await fireEvent.click(screen.getByLabelText('出差目的地'));
		expect(screen.getByText('上海')).toBeTruthy();
	});

	it('schemas 为空数组时渲染空面板', () => {
		render(PreviewPanel, { schemas: [], values });
		expect(screen.queryByRole('button')).toBeNull();
	});
});
