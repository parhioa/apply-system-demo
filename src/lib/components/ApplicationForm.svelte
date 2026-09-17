<script lang="ts">
	import type { FieldSchema, FieldValue } from '$lib/types';

	let {
		schemas,
		values,
		errors = {},
		disabled = false,
		onchange
	}: {
		schemas: FieldSchema[];
		values: Record<string, FieldValue>;
		errors?: Record<string, string>;
		disabled?: boolean;
		onchange?: (name: string, value: FieldValue) => void;
	} = $props();

	function handleChange(schema: FieldSchema, raw: string) {
		const next: FieldValue = schema.type === 'number' && raw !== '' ? Number(raw) : raw;
		onchange?.(schema.name, next);
	}
</script>

<div class="space-y-5">
	{#each schemas as schema (schema.name)}
		<div>
			<label
				for="field-{schema.name}"
				class="mb-1.5 block text-[13px] font-medium text-neutral-700"
			>
				{schema.label}
				{#if schema.required}
					<span class="text-apple"> *</span>
				{/if}
			</label>

			{#if schema.type === 'select'}
				<select
					id="field-{schema.name}"
					value={String(values[schema.name] ?? '')}
					{disabled}
					onchange={(e) => handleChange(schema, e.currentTarget.value)}
					class="bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22%3E%3Cpath d=%22M1 1l4 4 4-4%22 stroke=%22%23999%22 stroke-width=%221.5%22 fill=%22none%22 stroke-linecap=%22round%22/%3E%3C/svg%3E')] w-full appearance-none rounded-xl border bg-white bg-[length:10px_6px] bg-[right_0.9rem_center] bg-no-repeat py-2.5 pr-9 pl-3.5 text-sm transition-all focus:border-apple focus:ring-4 focus:ring-apple/10 focus:outline-none disabled:bg-neutral-50 {errors[
						schema.name
					]
						? 'border-red-300'
						: 'border-black/10'}"
				>
					<option value="" disabled>请选择</option>
					{#each schema.options ?? [] as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			{:else if schema.type === 'textarea'}
				<textarea
					id="field-{schema.name}"
					value={String(values[schema.name] ?? '')}
					{disabled}
					placeholder={schema.placeholder}
					oninput={(e) => handleChange(schema, e.currentTarget.value)}
					rows="3"
					class="w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm leading-relaxed transition-all focus:border-apple focus:ring-4 focus:ring-apple/10 focus:outline-none disabled:bg-neutral-50 {errors[
						schema.name
					]
						? 'border-red-300'
						: 'border-black/10'}"></textarea>
			{:else if schema.type === 'number'}
				<input
					id="field-{schema.name}"
					type="number"
					value={String(values[schema.name] ?? '')}
					{disabled}
					placeholder={schema.placeholder}
					oninput={(e) => handleChange(schema, e.currentTarget.value)}
					class="w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm transition-all focus:border-apple focus:ring-4 focus:ring-apple/10 focus:outline-none disabled:bg-neutral-50 {errors[
						schema.name
					]
						? 'border-red-300'
						: 'border-black/10'}"
				/>
			{:else}
				<input
					id="field-{schema.name}"
					type={schema.type === 'date' ? 'date' : 'text'}
					value={String(values[schema.name] ?? '')}
					{disabled}
					placeholder={schema.placeholder}
					oninput={(e) => handleChange(schema, e.currentTarget.value)}
					class="w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm transition-all focus:border-apple focus:ring-4 focus:ring-apple/10 focus:outline-none disabled:bg-neutral-50 {errors[
						schema.name
					]
						? 'border-red-300'
						: 'border-black/10'}"
				/>
			{/if}

			{#if errors[schema.name]}
				<p class="mt-1.5 flex items-center gap-1 text-[13px] text-red-500">
					<span class="text-xs">⚠</span>
					{errors[schema.name]}
				</p>
			{/if}
		</div>
	{/each}
</div>
