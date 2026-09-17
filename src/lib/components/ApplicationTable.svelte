<script lang="ts">
	import type { ApplicationItem } from '$lib/types';
	import StatusTag from './StatusTag.svelte';
	import { amountOf, formatTime, summaryOf } from '$lib/utils/validation';
	import { getApplicationTypeMeta } from '$lib/config/schemas';

	let {
		items,
		showApplicant = false,
		emptyText = '暂无申请记录',
		onview
	}: {
		items: ApplicationItem[];
		showApplicant?: boolean;
		emptyText?: string;
		onview?: (id: string) => void;
	} = $props();

	const typeIcon: Record<string, string> = {
		travel: '✈',
		training: '📚',
		leave: '☀'
	};

	function iconOf(item: ApplicationItem): string {
		return typeIcon[item.type] ?? '📋';
	}
</script>

{#if items.length === 0}
	<div
		class="rounded-3xl border border-dashed border-black/10 bg-white/70 py-16 text-center text-sm text-neutral-400"
	>
		<p class="text-2xl">📭</p>
		<p class="mt-2">{emptyText}</p>
	</div>
{:else}
	<div class="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-card">
		<div
			class="hidden items-center gap-4 border-b border-black/[0.06] px-5 py-3 text-xs font-medium text-neutral-400 md:flex"
		>
			<span class="w-20">单号</span>
			<span class="w-14">类型</span>
			{#if showApplicant}
				<span class="w-20">申请人</span>
			{/if}
			<span class="flex-1">摘要</span>
			<span class="w-20 text-right">金额</span>
			<span class="w-24">状态</span>
			<span class="w-24">提交时间</span>
			<span class="w-10"></span>
		</div>
		<ul class="divide-y divide-black/[0.05]">
			{#each items as item (item.id)}
				<li>
					<button
						type="button"
						onclick={() => onview?.(item.id)}
						class="flex w-full items-center gap-4 bg-white px-5 py-3.5 text-left transition-colors hover:bg-black/[0.03] active:bg-black/[0.05]"
					>
						<span class="hidden w-20 font-mono text-xs text-neutral-400 md:inline">{item.id}</span>
						<span
							class="hidden w-14 shrink-0 items-center gap-1.5 text-[13px] font-medium text-neutral-700 md:flex"
						>
							<span class="text-base">{iconOf(item)}</span>
							{getApplicationTypeMeta(item.type).label}
						</span>
						{#if showApplicant}
							<span class="hidden w-20 truncate text-[13px] text-neutral-600 md:inline"
								>{item.applicantName}</span
							>
						{/if}
						<span class="flex min-w-0 flex-1 flex-col">
							<span class="flex items-center gap-2">
								<span class="text-sm font-medium text-neutral-900 md:hidden"
									>{getApplicationTypeMeta(item.type).label}</span
								>
								<span class="truncate text-sm text-neutral-800">{summaryOf(item)}</span>
							</span>
							<span class="mt-0.5 flex items-center gap-2 text-xs text-neutral-400">
								<span class="font-mono md:hidden">{item.id}</span>
								{#if item.status === 'pending'}
									<span class="text-orange-500">● 待处理</span>
								{/if}
								<span class="md:hidden">提交于 {formatTime(item.createTime)}</span>
							</span>
						</span>
						<span
							class="hidden w-20 shrink-0 text-right text-sm text-neutral-800 tabular-nums md:block"
						>
							{#if amountOf(item) > 0}
								¥{amountOf(item).toLocaleString('zh-CN')}
							{:else}
								<span class="text-neutral-300">—</span>
							{/if}
						</span>
						<span class="hidden w-24 shrink-0 md:block"><StatusTag status={item.status} /></span>
						<span class="hidden w-24 shrink-0 text-xs text-neutral-400 md:block"
							>{formatTime(item.createTime)}</span
						>
						<span class="shrink-0 text-neutral-300 transition-transform group-open:rotate-90"
							>›</span
						>
					</button>
				</li>
			{/each}
		</ul>
	</div>
{/if}
