<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import ApplicationTable from '$lib/components/ApplicationTable.svelte';
	import { STATUS_META } from '$lib/config/schemas';
	import { currentUser } from '$lib/stores/auth';
	import { applications, loadApplications } from '$lib/stores/applications';
	import { APPLICATION_TYPES } from '$lib/config/schemas';
	import type { ApplicationStatus, ApplicationType } from '$lib/types';

	let statusFilter: ApplicationStatus | 'all' = $state('all');
	let typeFilter: ApplicationType | 'all' = $state('all');

	const isApprover = $derived($currentUser?.role === 'approver');

	const filtered = $derived(
		$applications
			.filter(
				(item) => isApprover || ($currentUser !== null && item.applicantId === $currentUser.id)
			)
			.filter((item) => statusFilter === 'all' || item.status === statusFilter)
			.filter((item) => typeFilter === 'all' || item.type === typeFilter)
	);

	const pendingCount = $derived($applications.filter((item) => item.status === 'pending').length);

	onMount(() => {
		loadApplications();
	});
</script>

<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight text-neutral-900">
			{isApprover ? '全部申请' : '我的申请'}
		</h1>
		<p class="mt-1 text-[13px] text-neutral-500">
			{#if isApprover && pendingCount > 0}
				<span class="font-medium text-orange-600">{pendingCount} 条待处理</span>
			{:else}
				查看和处理历史申请记录
			{/if}
		</p>
	</div>
	<button
		type="button"
		onclick={() => goto('/apply')}
		class="rounded-full bg-apple px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-apple-hover hover:shadow-md active:scale-[0.97]"
	>
		+ 发起申请
	</button>
</div>

<div class="mb-4 flex flex-wrap items-center gap-2.5">
	<div class="flex flex-wrap gap-1 rounded-full bg-black/[0.04] p-1">
		<button
			type="button"
			onclick={() => (statusFilter = 'all')}
			class="rounded-full px-3.5 py-1.5 text-[13px] transition-colors {statusFilter === 'all'
				? 'bg-white font-medium text-neutral-900 shadow-sm'
				: 'text-neutral-500 hover:text-neutral-800'}"
		>
			全部
		</button>
		{#each Object.entries(STATUS_META) as [key, meta] (key)}
			<button
				type="button"
				onclick={() => (statusFilter = key as ApplicationStatus)}
				class="rounded-full px-3.5 py-1.5 text-[13px] transition-colors {statusFilter === key
					? 'bg-white font-medium text-neutral-900 shadow-sm'
					: 'text-neutral-500 hover:text-neutral-800'}"
			>
				{meta.label}
			</button>
		{/each}
	</div>
	<select
		bind:value={typeFilter}
		class="rounded-full border border-black/10 bg-white px-3.5 py-2 text-[13px] text-neutral-700 transition-all focus:border-apple focus:ring-4 focus:ring-apple/10 focus:outline-none"
	>
		<option value="all">全部类型</option>
		{#each APPLICATION_TYPES as meta (meta.key)}
			<option value={meta.key}>{meta.label}</option>
		{/each}
	</select>
</div>

<ApplicationTable
	items={filtered}
	showApplicant={isApprover}
	onview={(id) => goto(`/detail/${id}`)}
/>
