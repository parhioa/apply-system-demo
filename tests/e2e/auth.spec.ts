import { test, expect } from '@playwright/test';

async function loginBy(page: import('@playwright/test').Page, name: string) {
	await page.goto('/login');
	await page.getByRole('button', { name }).click();
	await expect(page).toHaveURL(/\/list/);
}

test('未登录访问受保护页面会跳转到登录页', async ({ page }) => {
	await page.goto('/list');
	await expect(page).toHaveURL(/\/login/);
});

test('申请人视角只展示自己的申请', async ({ page }) => {
	await loginBy(page, '张三');
	await expect(page.getByText('A1001').first()).toBeVisible();
	await expect(page.getByText('A1004')).toHaveCount(0);
});

test('审批人视角可筛选列表状态', async ({ page }) => {
	await loginBy(page, '李四');
	await page.getByRole('button', { name: '已通过', exact: true }).click();
	await expect(page.getByText('A1001').first()).toBeVisible();
	await expect(page.getByText('A1007')).toHaveCount(0);
});

test('统计报表页展示指标与图表', async ({ page }) => {
	await loginBy(page, '李四');
	await page.getByRole('link', { name: '统计报表' }).click();
	await expect(page.getByText('申请总数')).toBeVisible();
	await expect(page.locator('canvas').first()).toBeVisible();
	await expect(page.locator('canvas')).toHaveCount(4);
});
