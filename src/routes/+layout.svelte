<script lang="ts">
	import './layout.css';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { currentUser, logout } from '$lib/stores/auth';
	import { loadApplications } from '$lib/stores/applications';

	let { children } = $props();

	const navItems = [
		{ href: '/list', label: '申请列表' },
		{ href: '/apply', label: '发起申请' },
		{ href: '/report', label: '统计报表' }
	];

	$effect(() => {
		const user = $currentUser;
		if (!user && page.url.pathname !== '/login') goto('/login');
		if (user && page.url.pathname === '/login') goto('/list');
		if (user) loadApplications();
	});

	function handleLogout() {
		logout();
		goto('/login');
	}
</script>

{#if $currentUser}
	<header class="sticky top-0 z-40 border-b border-black/[0.06] bg-white/70 backdrop-blur-2xl">
		<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
			<div class="flex items-center gap-2">
				<a href="/list" class="mr-3 flex items-center gap-2">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-[9px] bg-gradient-to-br from-apple to-sky-400 text-sm text-white shadow-sm"
						>✈</span
					>
					<span class="text-[15px] font-semibold tracking-tight text-neutral-900">通用申请系统</span
					>
				</a>
				<nav class="hidden items-center gap-1 sm:flex">
					{#each navItems as item (item.href)}
						<a
							href={item.href}
							class="rounded-full px-3.5 py-1.5 text-[13px] transition-colors {page.url.pathname ===
								item.href ||
							(item.href === '/list' && page.url.pathname.startsWith('/detail'))
								? 'bg-apple/10 font-medium text-apple'
								: 'text-neutral-600 hover:bg-black/[0.05]'}"
						>
							{item.label}
						</a>
					{/each}
				</nav>
			</div>
			<div class="flex items-center gap-2 text-sm">
				<div class="hidden items-center gap-2 md:flex">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-neutral-300 to-neutral-400 text-xs font-medium text-white"
						>{$currentUser.name.slice(0, 1)}</span
					>
					<span class="mb-1.5 text-[13px] text-neutral-600">
						{$currentUser.name}
						<span class="mx-1 text-neutral-300">·</span>
						<span class="text-neutral-400"
							>{$currentUser.role === 'approver' ? '审批人' : '申请人'}</span
						>
					</span>
				</div>
				<button
					type="button"
					onclick={handleLogout}
					class="rounded-full px-3 py-1.5 text-[13px] text-neutral-500 transition-colors hover:bg-black/[0.05] hover:text-neutral-700"
				>
					退出登录
				</button>
			</div>
		</div>
		<nav
			class="flex items-center justify-center gap-1 border-t border-black/[0.04] py-1.5 sm:hidden"
		>
			{#each navItems as item (item.href)}
				<a
					href={item.href}
					class="flex-1 rounded-full px-3 py-1.5 text-center text-[13px] transition-colors {page.url
						.pathname === item.href
						? 'bg-apple/10 font-medium text-apple'
						: 'text-neutral-600'}"
				>
					{item.label}
				</a>
			{/each}
		</nav>
	</header>
{/if}

<main class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
	{@render children()}
</main>
