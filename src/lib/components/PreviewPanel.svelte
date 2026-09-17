<script lang="ts">
	import type { FieldSchema, FieldValue } from '$lib/types';

	let {
		schemas,
		values,
		errors = {},
		onjump
	}: {
		schemas: FieldSchema[];
		values: Record<string, FieldValue>;
		errors?: Record<string, string>;
		onjump?: (name: string) => void;
	} = $props();

	function optionLabel(schema: FieldSchema, value: FieldValue | undefined): string {
		const raw = String(value ?? '');
		return schema.options?.find((o) => o.value === raw)?.label ?? raw;
	}
</script>

<div class="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-card">
	{#each schemas as schema (schema.name)}
		{@const value = values[schema.name]}
		{@const error = errors[schema.name]}
		<button
			type="button"
			onclick={() => onjump?.(schema.name)}
			aria-label={schema.label}
			class="group flex w-full items-center gap-4 border-b border-black/[0.04] px-5 py-3.5 text-left transition-colors last:border-b-0 {error
				? 'bg-red-50/50 hover:bg-red-50'
				: 'bg-white hover:bg-black/[0.03]'}"
		>
			<span class="w-24 shrink-0 text-[13px] text-neutral-500">{schema.label}</span>
			<span
				class="flex-1 text-sm {error ? 'text-red-600' : 'text-neutral-800'}"
				class:line-through={error}
			>
				{#if error}
					{error}
				{:else}
					{optionLabel(schema, value) || '—'}
				{/if}
			</span>
			<span
				class="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors {error
					? 'bg-red-100 text-red-600'
					: 'bg-black/[0.05] text-neutral-500 group-hover:bg-apple/10 group-hover:text-apple'}"
			>
				{error ? '去修改' : '修改'}
				<span class="text-[10px]">›</span>
			</span>
		</button>
	{/each}
</div>
