import { test, expect } from '@playwright/test';

test('申请人创建差旅申请并提交，进入待审批', async ({ page }) => {
	await page.goto('/login');
	await page.getByRole('button', { name: '张三' }).click();
	await expect(page).toHaveURL(/\/list/);

	await page.getByRole('link', { name: '发起申请' }).click();
	await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/apply($|\/)/);

	await page.getByRole('button', { name: /差旅申请/ }).click();

	await page.getByLabel('出差目的地').fill('上海');
	await page.getByLabel('开始日期').fill('2026-10-10');
	await page.getByLabel('结束日期').fill('2026-10-12');
	await page.getByLabel('交通方式').selectOption('train');
	await page.getByLabel('预估金额').fill('1200');
	await page.getByLabel('出差事由').fill('客户现场支持');

	await page.getByRole('button', { name: /预览确认/ }).click();
	await expect(page.getByText('上海')).toBeVisible();

	await page.getByRole('button', { name: '提交申请', exact: true }).click();
	await expect(page).toHaveURL(/\/detail\/A/);
	await expect(page.getByText('待审批')).toBeVisible();
});
