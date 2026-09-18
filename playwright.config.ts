import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
	use: {
		baseURL: 'http://localhost:4174',
		trace: 'on-first-retry',
		locale: 'zh-CN'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'pnpm run build && PORT=4174 node build/index.js',
		url: 'http://localhost:4174',
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
});
