import { spawn } from 'node:child_process';
import os from 'node:os';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 4175;
const OUTPUT_DIR = 'test-report';
const BASE_URL = `http://localhost:${PORT}`;

function runAndWait(cmd, args) {
	return new Promise((resolve) => {
		const child = spawn(cmd, args, { stdio: 'inherit' });
		child.on('exit', (code) => resolve(code ?? 0));
	});
}

async function startServer() {
	return spawn('python3', ['-m', 'http.server', String(PORT), '--directory', OUTPUT_DIR], {
		stdio: 'inherit'
	});
}

async function waitForReady() {
	for (let i = 0; i < 40; i += 1) {
		try {
			const res = await fetch(`${BASE_URL}/index.html`);
			if (res.ok) return;
		} catch {
			/* try again */
		}
		await sleep(500);
	}
	throw new Error('报告服务启动失败');
}

function openBrowser() {
	if (os.platform() === 'darwin') {
		spawn('open', [BASE_URL], { stdio: 'ignore' });
	} else if (os.platform() === 'linux') {
		spawn('xdg-open', [BASE_URL], { stdio: 'ignore' });
	}
	console.log(`\n测试报告已生成并启动：${BASE_URL}/ （按 Ctrl+C 退出）\n`);
}

const code = await runAndWait('pnpm', ['exec', 'vitest', 'run']);
if (code !== 0) {
	console.error('单元测试未通过，跳过生成报告。');
	process.exit(code);
}

const server = await startServer();
try {
	await waitForReady();
	openBrowser();
} catch (err) {
	console.error(err.message);
	server.kill();
	process.exit(1);
}

const shutdown = () => {
	server.kill();
	process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
