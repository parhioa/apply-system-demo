<script lang="ts">
	import { goto } from '$app/navigation';
	import { users } from '$lib/services/applicationApi';
	import { login } from '$lib/stores/auth';
	import type { User } from '$lib/types';

	function handleLogin(user: User) {
		if (login(user.id)) goto('/list');
	}
</script>

<div class="relative flex min-h-[80vh] flex-col items-center justify-center py-10">
	<div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
		<div
			class="absolute top-[-20%] left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-b from-apple/20 via-sky-200/30 to-transparent blur-3xl"
		></div>
	</div>

	<div class="mb-8 text-center">
		<span
			class="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-apple to-sky-400 text-2xl text-white shadow-card"
			>✈</span
		>
		<h1 class="mt-4 text-3xl font-semibold tracking-tight text-neutral-900">通用申请管理系统</h1>
		<p class="mt-2 text-[15px] text-neutral-500">差旅 · 培训 · 请假，一次搞定</p>
	</div>

	<div
		class="w-full max-w-sm space-y-2.5 rounded-3xl border border-black/[0.06] bg-white/80 p-3 shadow-card backdrop-blur"
	>
		<p class="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-neutral-400 uppercase">
			选择身份登录（Demo）
		</p>
		{#each users as user (user.id)}
			<button
				type="button"
				onclick={() => handleLogin(user)}
				class="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all hover:bg-black/[0.04] active:scale-[0.98]"
			>
				<span
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white shadow-sm {user.role ===
					'approver'
						? 'bg-gradient-to-br from-sky-400 to-apple'
						: 'bg-gradient-to-br from-emerald-400 to-teal-600'}"
				>
					{user.name.slice(0, 1)}
				</span>
				<span class="min-w-0 flex-1">
					<span class="block text-[15px] font-medium text-neutral-900">{user.name}</span>
					<span class="block truncate text-[13px] text-neutral-500">
						{user.department} · {user.role === 'approver' ? '审批人' : '申请人'}
					</span>
				</span>
				<span class="text-[13px] text-apple opacity-0 transition-opacity group-hover:opacity-100"
					>进入 →</span
				>
			</button>
		{/each}
	</div>
</div>
