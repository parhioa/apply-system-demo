<script lang="ts">
	import type { ApplicationItem, ApprovalStep } from '$lib/types';

	let { item }: { item: ApplicationItem } = $props();

	function stepStatus(step: ApprovalStep, index: number): 'done' | 'active' | 'todo' | 'rejected' {
		if (step.status === 'approved') return 'done';
		if (step.status === 'rejected') return 'rejected';
		if (item.status === 'pending' && index === item.currentStepIndex) return 'active';
		return 'todo';
	}
</script>

<ol class="flex">
	{#each item.flow as step, index (index)}
		{@const state = stepStatus(step, index)}
		<li class="relative flex flex-1 flex-col items-center">
			<div
				class="z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all {state ===
				'done'
					? 'bg-gradient-to-b from-green-500 to-green-600 text-white shadow-sm'
					: state === 'rejected'
						? 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm'
						: state === 'active'
							? 'border-2 border-apple bg-white text-apple shadow-sm'
							: 'border border-black/10 bg-white text-neutral-400'}"
			>
				{#if state === 'done'}
					<svg
						viewBox="0 0 24 24"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
					>
						<path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				{:else if state === 'rejected'}
					<svg
						viewBox="0 0 24 24"
						class="h-3.5 w-3.5"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
					>
						<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
					</svg>
				{:else if state === 'active'}
					<span class="h-2 w-2 animate-pulse rounded-full bg-apple"></span>
				{:else}
					{index + 1}
				{/if}
			</div>

			{#if index < item.flow.length - 1}
				<div
					class="absolute top-[17px] h-[3px] rounded-full transition-colors {state === 'done'
						? 'bg-green-500'
						: 'bg-black/10'}"
					style="left: calc(50% + 18px); width: calc(100% - 36px)"
				></div>
			{/if}
		</li>
	{/each}
</ol>

<ol class="flex">
	{#each item.flow as step, index (index)}
		{@const state = stepStatus(step, index)}
		<li class="flex flex-1 flex-col items-center">
			<span
				class="mt-2.5 text-center text-xs {state === 'active'
					? 'font-semibold text-apple'
					: state === 'done'
						? 'font-medium text-neutral-700'
						: 'text-neutral-400'}"
			>
				{step.role} · {step.name}
			</span>
			{#if step.comment}
				<span class="mt-0.5 max-w-[120px] truncate text-[10px] text-neutral-400"
					>{step.comment}</span
				>
			{/if}
		</li>
	{/each}
</ol>
