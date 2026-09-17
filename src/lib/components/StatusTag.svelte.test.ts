import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import StatusTag from './StatusTag.svelte';

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
});
