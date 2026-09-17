import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import PreviewPanel from './PreviewPanel.svelte';
import { FIELD_SCHEMAS } from '$lib/config/schemas';
import type { FieldValue } from '$lib/types';

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

	it('空值渲染占位符 —', () => {
		render(PreviewPanel, { schemas: travelSchemas, values: {} });
		expect(screen.getAllByText('—').length).toBeGreaterThan(0);
	});
});
