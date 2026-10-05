import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ProgressBar from './ProgressBar.svelte';
import type { ApplicationItem, ApprovalStep } from '../types';

const CHECK_PATH = 'path[d="M5 13l4 4L19 7"]';
const CROSS_PATH = 'path[d="M6 6l12 12M18 6L6 18"]';

function createItem(partial: Partial<ApplicationItem>): ApplicationItem {
	return {
		id: 'p1',
		type: 'travel',
		applicantId: 'u1',
		applicantName: '张三',
		department: '研发部',
		fields: {},
		status: 'pending',
		flow: [
			{ role: '直属主管', name: '李四', status: 'pending' },
			{ role: '财务审批', name: '王五', status: 'pending' }
		],
		currentStepIndex: 0,
		auditLog: [],
		createTime: '2026-09-01T00:00:00.000Z',
		updateTime: '2026-09-01T00:00:00.000Z',
		...partial
	};
}

function done(name: string, comment?: string): ApprovalStep {
	return { role: name, name: '李四', status: 'approved', comment };
}

describe('ProgressBar.svelte', () => {
	it('待审批时当前步骤高亮（脉冲点），后续步骤显示序号', () => {
		const { container } = render(ProgressBar, { item: createItem({}) });

		expect(container.querySelector('.animate-pulse')).toBeTruthy();
		expect(screen.getByText('2')).toBeTruthy();
		expect(screen.queryByText('1')).toBeNull();
	});

	it('已通过的步骤显示对勾，且不再高亮当前步骤', () => {
		const { container } = render(ProgressBar, {
			item: createItem({
				flow: [done('直属主管'), { role: '财务审批', name: '王五', status: 'pending' }],
				currentStepIndex: 1
			})
		});

		expect(container.querySelector(CHECK_PATH)).toBeTruthy();
		expect(container.querySelector('.animate-pulse')).toBeTruthy();
		expect(screen.queryByText('2')).toBeNull();
	});

	it('被驳回的步骤显示叉号', () => {
		const { container } = render(ProgressBar, {
			item: createItem({
				status: 'rejected',
				flow: [{ role: '直属主管', name: '李四', status: 'rejected' }],
				currentStepIndex: 0
			})
		});

		expect(container.querySelector(CROSS_PATH)).toBeTruthy();
		expect(container.querySelector('.animate-pulse')).toBeNull();
	});

	it('终态单据不再高亮任何步骤，全部按已通过 / 待处理展示', () => {
		const { container } = render(ProgressBar, {
			item: createItem({
				status: 'withdrawn',
				flow: [done('直属主管'), { role: '财务审批', name: '王五', status: 'pending' }]
			})
		});

		expect(container.querySelector('.animate-pulse')).toBeNull();
		expect(container.querySelector(CHECK_PATH)).toBeTruthy();
		expect(screen.getByText('2')).toBeTruthy();
	});

	it('渲染审批环节角色、审批人与审批意见', () => {
		render(ProgressBar, {
			item: createItem({
				flow: [done('直属主管', '同意'), { role: '财务审批', name: '王五', status: 'pending' }]
			})
		});

		expect(screen.getByText('直属主管 · 李四')).toBeTruthy();
		expect(screen.getByText('财务审批 · 王五')).toBeTruthy();
		expect(screen.getByText('同意')).toBeTruthy();
	});

	it('每一级审批渲染两行（进度点 + 文案），共 flow.length * 2 个节点', () => {
		const { container } = render(ProgressBar, { item: createItem({}) });
		expect(container.querySelectorAll('li')).toHaveLength(4);
	});

	it('审批链为空时渲染空列表而不报错', () => {
		const { container } = render(ProgressBar, { item: createItem({ flow: [] }) });
		expect(container.querySelectorAll('li')).toHaveLength(0);
	});
});
