<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ACTION_META, getApplicationTypeMeta, getFieldSchemas } from '$lib/config/schemas';
	import { currentUser } from '$lib/stores/auth';
	import { runTransition } from '$lib/stores/applications';
	import { getApplicationById } from '$lib/services/applicationApi';
	import type { ApplicationItem } from '$lib/types';
	import StatusTag from '$lib/components/StatusTag.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { formatTime } from '$lib/utils/validation';

	let { params } = $props();

	let item: ApplicationItem | null = $state(null);
	let notFound = $state(false);
	let comment = $state('');
	let busy = $state(false);

	function getSchemasOf(value: ApplicationItem | null) {
		return value ? getFieldSchemas(value.type) : [];
	}

	const schemas = $derived(getSchemasOf(item));

	function optionLabel(name: string, value: string | number | undefined): string {
		const schema = schemas.find((s) => s.name === name);
		const raw = String(value ?? '');
		return schema?.options?.find((o) => o.value === raw)?.label ?? raw;
	}

	async function refresh() {
		item = await getApplicationById(params.id);
		if (!item) notFound = true;
	}

	onMount(refresh);

	async function act(action: 'approve' | 'reject' | 'withdraw' | 'submit') {
		if (action === 'reject' && !comment.trim()) return;
		busy = true;
		try {
			await runTransition(item!.id, action, comment.trim(), $currentUser?.id ?? '');
			comment = '';
			await refresh();
		} finally {
			busy = false;
		}
	}
</script>

{#if notFound}
	<div class="py-24 text-center text-sm text-neutral-400">申请不存在</div>
{:else if !item}
	<div class="flex items-center justify-center gap-2 py-24 text-sm text-neutral-400">
		<span class="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-apple"
		></span>
		加载中…
	</div>
{:else}
	{@const typeMeta = getApplicationTypeMeta(item.type)}
	<button
		type="button"
		onclick={() => goto('/list')}
		class="mb-5 inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
	>
		<span>&larr;</span> 返回列表
	</button>

	<div class="mb-5 flex flex-wrap items-start justify-between gap-3">
		<div class="flex items-center gap-3.5">
			<span
				class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-apple to-sky-400 text-2xl text-white shadow-sm"
			>
				{typeMeta.label === '差旅申请' ? '✈' : typeMeta.label === '培训申请' ? '📚' : '☀'}
			</span>
			<div>
				<h1
					class="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-neutral-900"
				>
					{typeMeta.label}
					<span class="font-mono text-xs font-normal text-neutral-400">{item.id}</span>
				</h1>
				<p class="mt-1 text-[13px] text-neutral-500">
					{item.applicantName} · {item.department} · 提交于 {formatTime(item.createTime)}
				</p>
			</div>
		</div>
		<StatusTag status={item.status} />
	</div>

	<div class="mb-5 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-card">
		<h2 class="mb-4 text-xs font-medium tracking-wider text-neutral-400 uppercase">申请信息</h2>
		<dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
			{#each schemas as schema (schema.name)}
				<div>
					<dt class="text-[13px] text-neutral-400">{schema.label}</dt>
					<dd class="mt-0.5 text-sm text-neutral-800">
						{#if schema.type === 'select'}
							{optionLabel(schema.name, item.fields[schema.name])}
						{:else if schema.name === 'amount'}
							<span class="tabular-nums"
								>¥{Number(item.fields.amount ?? 0).toLocaleString('zh-CN')}</span
							>
						{:else}
							{String(item.fields[schema.name] ?? '') || '—'}
						{/if}
					</dd>
				</div>
			{/each}
		</dl>
	</div>

	<div class="mb-5 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-card">
		<h2 class="mb-5 text-xs font-medium tracking-wider text-neutral-400 uppercase">审批进度</h2>
		<ProgressBar {item} />
	</div>

	{#if item.status === 'pending' && $currentUser?.role === 'approver'}
		{@const currentStep = item.flow[item.currentStepIndex]}
		<div
			class="mb-5 overflow-hidden rounded-3xl border border-apple/20 bg-gradient-to-b from-apple/[0.06] to-transparent p-6"
		>
			<div class="mb-3 flex items-center gap-2">
				<span class="relative flex h-2.5 w-2.5">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-apple opacity-60"
					></span>
					<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-apple"></span>
				</span>
				<h2 class="text-sm font-medium text-neutral-800">
					{currentStep?.role}（{currentStep?.name}）审批中
				</h2>
			</div>
			<textarea
				placeholder="审批意见（驳回时必须填写原因）"
				bind:value={comment}
				rows="2"
				class="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm transition-all focus:border-apple focus:ring-4 focus:ring-apple/10 focus:outline-none"
			></textarea>
			<div class="mt-3 flex gap-3">
				<button
					type="button"
					disabled={busy}
					onclick={() => act('approve')}
					class="rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-60 {ACTION_META
						.approve.color}"
				>
					通过
				</button>
				<button
					type="button"
					disabled={busy || !comment.trim()}
					onclick={() => act('reject')}
					class="rounded-full px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-40 {ACTION_META
						.reject.color}"
				>
					驳回
				</button>
			</div>
		</div>
	{/if}

	<div class="mb-5 flex flex-wrap items-center gap-3">
		{#if item.status === 'pending' && $currentUser?.role === 'applicant'}
			<button
				type="button"
				disabled={busy}
				onclick={() => act('withdraw')}
				class="rounded-full px-5 py-2 text-sm font-medium shadow-sm transition-all active:scale-[0.97] disabled:opacity-60 {ACTION_META
					.withdraw.color}"
			>
				撤销申请
			</button>
		{/if}

		{#if (item.status === 'rejected' || item.status === 'draft') && $currentUser?.role === 'applicant'}
			<button
				type="button"
				onclick={() => goto(`/apply/${item!.id}`)}
				class="rounded-full bg-apple px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
			>
				{item.status === 'rejected' ? '修改并重新提交' : '继续编辑'}
			</button>
			{#if item.status === 'draft'}
				<button
					type="button"
					disabled={busy}
					onclick={() => act('submit')}
					class="rounded-full bg-apple px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.97] disabled:opacity-60"
				>
					提交申请
				</button>
			{/if}
		{/if}
	</div>

	<div class="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-card">
		<h2 class="mb-4 text-xs font-medium tracking-wider text-neutral-400 uppercase">操作记录</h2>
		{#if item.auditLog.length === 0}
			<p class="text-sm text-neutral-400">暂无操作记录</p>
		{:else}
			<ol class="space-y-4">
				{#each item.auditLog as log, index (index)}
					<li
						class="relative flex gap-3 pl-5 text-sm {index < item.auditLog.length - 1
							? 'pb-4'
							: ''}"
					>
						<span
							class="absolute top-1.5 left-0 h-2 w-2 rounded-full {log.action === 'reject'
								? 'bg-red-500'
								: log.action === 'withdraw'
									? 'bg-neutral-400'
									: 'bg-green-500'}"
						></span>
						{#if index < item.auditLog.length - 1}
							<span class="absolute top-4 left-[3px] h-full w-px bg-black/[0.08]"></span>
						{/if}
						<div class="min-w-0 flex-1">
							<span class="text-neutral-800">
								{log.operatorName}
								<span class="text-neutral-400">{ACTION_META[log.action].label}</span>
							</span>
							{#if log.comment}
								<span class="ml-2 text-neutral-500">「{log.comment}」</span>
							{/if}
						</div>
						<span class="shrink-0 text-xs text-neutral-400">{formatTime(log.time)}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
{/if}
