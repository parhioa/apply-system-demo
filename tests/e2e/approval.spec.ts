import { test, expect, type Page } from '@playwright/test';

async function loginBy(page: Page, name: string) {
	await page.goto('/login');
	await page.getByRole('button', { name }).click();
	await expect(page).toHaveURL(/\/list/);
}

/** 从列表里点开某个单号（走客户端路由，保留内存数据） */
async function openItem(page: Page, id: string) {
	await page.getByRole('button', { name: new RegExp(id) }).click();
	await expect(page).toHaveURL(new RegExp(`/detail/${id}`));
}

test('多级审批：主管通过后仍需财务审批，末级通过后变为已通过', async ({ page }) => {
	await loginBy(page, '李四');
	await openItem(page, 'A1007');

	await page.getByPlaceholder('审批意见（驳回时必须填写原因）').fill('同意');
	await page.getByRole('button', { name: '通过', exact: true }).click();
	await expect(page.getByText('待审批')).toBeVisible();

	await page.getByRole('button', { name: '退出登录' }).click();
	await page.getByRole('button', { name: '王五' }).click();
	await expect(page).toHaveURL(/\/list/);

	await openItem(page, 'A1007');
	await page.getByRole('button', { name: '通过', exact: true }).click();
	await expect(page.getByText('已通过')).toBeVisible();
});

test('驳回后申请人可修改并重新提交', async ({ page }) => {
	await loginBy(page, '李四');
	await openItem(page, 'A1007');

	await page.getByPlaceholder('审批意见（驳回时必须填写原因）').fill('行程不明确，请补充');
	await page.getByRole('button', { name: '驳回', exact: true }).click();
	await expect(page.getByText('已驳回')).toBeVisible();

	await page.getByRole('button', { name: '退出登录' }).click();
	await page.getByRole('button', { name: '张三' }).click();
	await expect(page).toHaveURL(/\/list/);

	await openItem(page, 'A1007');
	await page.getByRole('button', { name: '修改并重新提交' }).click();
	await expect(page).toHaveURL(/\/apply\/A1007/);

	await page.getByRole('button', { name: /预览确认/ }).click();
	await page.getByRole('button', { name: '保存并重新提交', exact: true }).click();
	await expect(page).toHaveURL(/\/detail\/A1007/);
	await expect(page.getByText('待审批')).toBeVisible();
});
