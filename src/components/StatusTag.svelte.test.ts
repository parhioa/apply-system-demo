import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import StatusTag from './StatusTag.svelte';
import { STATUS_META } from '../config/schemas';
import type { ApplicationStatus } from '../types';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
	draft: '草稿',
	pending: '待审批',
	approved: '已通过',
	rejected: '已驳回',
	withdrawn: '已撤销'
};

describe('StatusTag.svelte', () => {
	it('渲染待审批文案', () => {
		render(StatusTag, { status: 'pending' });
		expect(screen.getByText('待审批')).toBeTruthy();
	});

	it('渲染已通过文案', () => {
		render(StatusTag, { status: 'approved' });
		expect(screen.getByText('已通过')).toBeTruthy();
	});

	it('渲染草稿 / 已撤销文案', () => {
		render(StatusTag, { status: 'draft' });
		expect(screen.getByText('草稿')).toBeTruthy();
		render(StatusTag, { status: 'withdrawn' });
		expect(screen.getByText('已撤销')).toBeTruthy();
	});

	it('五种状态都能渲染且文案与配置一致', () => {
		for (const [status, label] of Object.entries(STATUS_LABELS) as Array<
			[ApplicationStatus, string]
		>) {
			const { container, unmount } = render(StatusTag, { status });
			expect(screen.getByText(label)).toBeTruthy();
			expect(container.textContent).toContain(STATUS_META[status].label);
			unmount();
		}
	});

	it('渲染状态圆点与标签样式类', () => {
		const { container } = render(StatusTag, { status: 'rejected' });
		expect(container.querySelector(`.${STATUS_META.rejected.dot}`)).toBeTruthy();
	});
});
