import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ApplicationTable from './ApplicationTable.svelte';
import type { ApplicationItem } from '../types';

function createItem(partial: Partial<ApplicationItem>): ApplicationItem {
	return {
		id: 'A1001',
		type: 'travel',
		applicantId: 'u1',
		applicantName: '张三',
		department: '研发部',
		fields: { destination: '上海', amount: 3200 },
		status: 'pending',
		flow: [],
		currentStepIndex: 0,
		auditLog: [],
		createTime: '2026-08-01T02:00:00.000Z',
		updateTime: '2026-08-01T02:00:00.000Z',
		...partial
	};
}

describe('ApplicationTable.svelte', () => {
	it('空列表展示默认空态文案', () => {
		render(ApplicationTable, { items: [] });
		expect(screen.getByText('暂无申请记录')).toBeTruthy();
	});

	it('空列表支持自定义空态文案', () => {
		render(ApplicationTable, { items: [], emptyText: '还没有申请' });
		expect(screen.getByText('还没有申请')).toBeTruthy();
	});

	it('渲染单号、类型、摘要、金额、状态与提交日期', () => {
		render(ApplicationTable, { items: [createItem({})] });

		expect(screen.getAllByText('A1001').length).toBeGreaterThan(0);
		expect(screen.getAllByText('差旅申请').length).toBeGreaterThan(0);
		expect(screen.getByText('出差 上海')).toBeTruthy();
		expect(screen.getByText('¥3,200')).toBeTruthy();
		expect(screen.getByText('待审批')).toBeTruthy();
		expect(screen.getAllByText('2026-08-01').length).toBeGreaterThan(0);
	});

	it('待处理单据额外展示待处理标记', () => {
		render(ApplicationTable, { items: [createItem({ status: 'pending' })] });
		expect(screen.getByText('● 待处理')).toBeTruthy();
	});

	it('非待处理单据不展示待处理标记', () => {
		render(ApplicationTable, { items: [createItem({ status: 'approved' })] });
		expect(screen.queryByText('● 待处理')).toBeNull();
		expect(screen.getByText('已通过')).toBeTruthy();
	});

	it('金额为 0 或缺失时展示占位符', () => {
		render(ApplicationTable, {
			items: [
				createItem({ id: 'a', fields: { destination: '上海', amount: 0 } }),
				createItem({ id: 'b', type: 'leave', fields: { leaveType: 'annual', days: 3 } })
			]
		});
		expect(screen.queryByText(/^¥/)).toBeNull();
		expect(screen.getByText('年假 3 天')).toBeTruthy();
	});

	it('showApplicant 为 false 时不展示申请人列', () => {
		render(ApplicationTable, { items: [createItem({})] });
		expect(screen.queryByText('张三')).toBeNull();
	});

	it('showApplicant 为 true 时展示申请人', () => {
		render(ApplicationTable, {
			items: [createItem({ applicantName: '王五' })],
			showApplicant: true
		});
		expect(screen.getByText('王五')).toBeTruthy();
	});

	it('点击行触发 onview 并带上单号', async () => {
		const onview = vi.fn();
		render(ApplicationTable, { items: [createItem({})], onview });

		await fireEvent.click(screen.getByText('出差 上海'));
		expect(onview).toHaveBeenCalledWith('A1001');
	});

	it('未传 onview 时点击不报错', async () => {
		render(ApplicationTable, { items: [createItem({})] });
		await fireEvent.click(screen.getByText('出差 上海'));
		expect(screen.getByText('待审批')).toBeTruthy();
	});

	it('多条数据时每条各渲染一次单号', () => {
		render(ApplicationTable, {
			items: [createItem({ id: 'A1' }), createItem({ id: 'A2' })]
		});
		expect(screen.getAllByText('A1').length).toBeGreaterThan(0);
		expect(screen.getAllByText('A2').length).toBeGreaterThan(0);
	});
});
