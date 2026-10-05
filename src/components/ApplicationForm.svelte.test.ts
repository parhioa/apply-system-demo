import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ApplicationForm from './ApplicationForm.svelte';
import { FIELD_SCHEMAS } from '../config/schemas';
import type { FieldValue } from '../types';

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

	it('必填字段渲染必填标记，数量与 schema 一致', () => {
		render(ApplicationForm, { schemas: travelSchemas, values: {} });
		expect(screen.getAllByText('*')).toHaveLength(travelSchemas.filter((s) => s.required).length);
	});

	it('回显已填写的值', () => {
		const values: Record<string, FieldValue> = { destination: '上海', amount: 800 };
		render(ApplicationForm, { schemas: travelSchemas, values });

		expect((screen.getByLabelText(/出差目的地/) as HTMLInputElement).value).toBe('上海');
		expect((screen.getByLabelText(/预估金额/) as HTMLInputElement).value).toBe('800');
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

	it('number 清空时回传空字符串，交由上层做必填校验', async () => {
		const onchange = vi.fn();
		render(ApplicationForm, { schemas: travelSchemas, values: { amount: 800 }, onchange });

		await fireEvent.input(screen.getByLabelText(/预估金额/), { target: { value: '' } });
		expect(onchange).toHaveBeenCalledWith('amount', '');
	});

	it('textarea 与 date 输入同样触发 onchange', async () => {
		const onchange = vi.fn();
		render(ApplicationForm, { schemas: travelSchemas, values: {}, onchange });

		await fireEvent.input(screen.getByLabelText(/出差事由/), {
			target: { value: '拜访客户' }
		});
		await fireEvent.input(screen.getByLabelText(/开始日期/), {
			target: { value: '2026-10-01' }
		});

		expect(onchange).toHaveBeenNthCalledWith(1, 'reason', '拜访客户');
		expect(onchange).toHaveBeenNthCalledWith(2, 'startDate', '2026-10-01');
	});

	it('未传 onchange 时输入不报错（组件为受控展示，值由上层决定）', async () => {
		render(ApplicationForm, { schemas: travelSchemas, values: {} });
		await fireEvent.input(screen.getByLabelText(/出差目的地/), {
			target: { value: '上海' }
		});
		expect((screen.getByLabelText(/出差目的地/) as HTMLInputElement).value).toBe('上海');
	});

	it('错误信息在控件下方展示', () => {
		render(ApplicationForm, {
			schemas: travelSchemas,
			values: {},
			errors: { destination: '请填写出差目的地' }
		});
		expect(screen.getByText('请填写出差目的地')).toBeTruthy();
	});

	it('number 字段的错误信息也能展示', () => {
		render(ApplicationForm, {
			schemas: travelSchemas,
			values: {},
			errors: { amount: '预估金额不能小于 1' }
		});
		expect(screen.getByText('预估金额不能小于 1')).toBeTruthy();
	});

	it('disabled 时所有控件不可编辑', () => {
		render(ApplicationForm, { schemas: travelSchemas, values: {}, disabled: true });
		expect((screen.getByLabelText(/出差目的地/) as HTMLInputElement).disabled).toBe(true);
		expect((screen.getByLabelText(/交通方式/) as HTMLSelectElement).disabled).toBe(true);
		expect((screen.getByLabelText(/预估金额/) as HTMLInputElement).disabled).toBe(true);
		expect((screen.getByLabelText(/出差事由/) as HTMLTextAreaElement).disabled).toBe(true);
	});

	it('schemas 为空数组时渲染空表单不报错', () => {
		render(ApplicationForm, { schemas: [], values: {} });
		expect(screen.queryByRole('textbox')).toBeNull();
	});
});
