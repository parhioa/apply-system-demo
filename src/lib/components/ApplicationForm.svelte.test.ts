import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ApplicationForm from './ApplicationForm.svelte';
import { FIELD_SCHEMAS } from '$lib/config/schemas';

const travelSchemas = FIELD_SCHEMAS.travel;

describe('ApplicationForm.svelte', () => {
	it('按 schema 渲染 text / number / date / select / textarea 控件', () => {
		render(ApplicationForm, { schemas: travelSchemas, values: {} });

		expect(screen.getByLabelText(/出差目的地/)).toBeTruthy();
		expect(screen.getByLabelText(/交通方式/)).toBeTruthy();
		expect(screen.getByLabelText(/预估金额/)).toBeTruthy();
		expect(screen.getByLabelText(/开始日期/)).toBeTruthy();
		expect(screen.getByLabelText(/出差事由/)).toBeTruthy();
	});

	it('必填字段渲染必填标记', () => {
		render(ApplicationForm, { schemas: travelSchemas, values: {} });
		expect(screen.getAllByText('*').length).toBeGreaterThan(0);
	});

	it('文本输入触发 onchange 回调', async () => {
		const onchange = vi.fn();
		render(ApplicationForm, { schemas: travelSchemas, values: {}, onchange });

		await fireEvent.input(screen.getByLabelText(/出差目的地/), {
			target: { value: '上海' }
		});
		expect(onchange).toHaveBeenCalledWith('destination', '上海');
	});

	it('select 选择触发 onchange 回调', async () => {
		const onchange = vi.fn();
		render(ApplicationForm, { schemas: travelSchemas, values: {}, onchange });

		await fireEvent.change(screen.getByLabelText(/交通方式/), {
			target: { value: 'train' }
		});
		expect(onchange).toHaveBeenCalledWith('transportation', 'train');
	});

	it('number 输入以数字类型触发 onchange', async () => {
		const onchange = vi.fn();
		render(ApplicationForm, { schemas: travelSchemas, values: {}, onchange });

		await fireEvent.input(screen.getByLabelText(/预估金额/), {
			target: { value: '800' }
		});
		expect(onchange).toHaveBeenCalledWith('amount', 800);
	});

	it('错误信息在控件下方展示', () => {
		render(ApplicationForm, {
			schemas: travelSchemas,
			values: {},
			errors: { destination: '请填写出差目的地' }
		});
		expect(screen.getByText('请填写出差目的地')).toBeTruthy();
	});

	it('disabled 时控件不可编辑', () => {
		render(ApplicationForm, { schemas: travelSchemas, values: {}, disabled: true });
		expect((screen.getByLabelText(/出差目的地/) as HTMLInputElement).disabled).toBe(true);
	});
});
