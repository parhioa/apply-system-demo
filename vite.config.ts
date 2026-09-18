import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	resolve: {
		conditions: ['module', 'import', 'browser', 'default']
	},
	test: {
		environment: 'jsdom',
		globals: true,
		expect: { requireAssertions: true },
		include: ['src/**/*.test.ts'],
		reporters: ['default', 'html'],
		outputFile: { html: './test-report/index.html' }
	}
});
