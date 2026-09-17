<script lang="ts">
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { tick } from 'svelte';
	import { APPLICATION_TYPES, getFieldSchemas } from '$lib/config/schemas';
	import { currentUser } from '$lib/stores/auth';
	import { saveApplication, saveFieldEdit, runTransition } from '$lib/stores/applications';
	import type { ApplicationItem, ApplicationType, FieldValue } from '$lib/types';
	import { validateFields } from '$lib/utils/validation';
	import ApplicationForm from './ApplicationForm.svelte';
	import PreviewPanel from './PreviewPanel.svelte';

	let { existing = null }: { existing?: ApplicationItem | null } = $props();

	const editing = $derived(!!existing);

	let type: ApplicationType = $state('travel');
	let values: Record<string, FieldValue> = $state({});
	let errors: Record<string, string> = $state({});
	let step: 'form' | 'preview' = $state('form');
	let busy = $state(false);
	let savingDraft = $state(false);

	const schemas = $derived(getFieldSchemas(type));

	const typeIcon: Record<ApplicationType, string> = {
		travel: '✈',
		training: '📚',
		leave: '☀'
	};

	$effect(() => {
		if (existing) {
			type = existing.type;
			values = { ...existing.fields };
			errors = {};
			step = 'form';
		}
	});

	function chooseType(next: ApplicationType) {
		type = next;
		values = {};
		errors = {};
		step = 'form';
	}

	function handleChange(name: string, value: FieldValue) {
		values[name] = value;
	}

	async function focusField(name: string) {
		step = 'form';
		await tick();
		document.getElementById(`field-${name}`)?.focus();
	}

	function gotoPreview() {
		errors = validateFields(schemas, values);
		if (Object.keys(errors).length === 0) {
			step = 'preview';
		} else {
			focusField(Object.keys(errors)[0]);
		}
	}

	async function submit() {
		const errs = validateFields(schemas, values);
		if (Object.keys(errs).length > 0) {
			errors = errs;
			await focusField(Object.keys(errs)[0]);
			return;
		}
		busy = true;
		try {
			const user = get(currentUser);
			if (editing && existing) {
				await saveFieldEdit(existing.id, values);
				await runTransition(existing.id, 'submit', '', user?.id ?? '');
				await goto(`/detail/${existing.id}`);
			} else {
				const created = await saveApplication({
					type,
					applicantId: user?.id ?? '',
					fields: values,
					submitNow: true
				});
				await goto(`/detail/${created.id}`);
			}
		} finally {
			busy = false;
		}
	}

	async function saveAsDraft() {
		savingDraft = true;
		try {
			const user = get(currentUser);
			if (editing && existing) {
				await saveFieldEdit(existing.id, values);
				await goto(`/detail/${existing.id}`);
			} else {
				const created = await saveApplication({
					type,
					applicantId: user?.id ?? '',
					fields: values,
					submitNow: false
				});
				await goto(`/detail/${created.id}`);
			}
		} finally {
			savingDraft = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl">
	<div class="mb-6">
		<h1 class="text-2xl font-semibold tracking-tight text-neutral-900">
			{editing ? '修改申请' : '发起申请'}
		</h1>

		{#if !editing}
			<ol class="mt-4 flex items-center gap-2">
				{#each ['选择类型', '填写信息', '预览确认'] as label, i (label)}
					<li class="flex items-center gap-2">
						<span
							class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold {i <=
							(step === 'preview' ? 1 : 0)
								? 'bg-apple text-white'
								: i === 1
									? 'bg-apple/10 text-apple'
									: 'bg-neutral-100 text-neutral-400'}">{i + 1}</span
						>
						<span
							class="text-[13px] {i === 0
								? 'font-medium text-apple'
								: i === 1
									? 'text-neutral-700'
									: 'text-neutral-400'}"
						>
							{label}
						</span>
						{#if i < 2}
							<span class="mx-1 h-px w-6 bg-neutral-200"></span>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}
	</div>

	{#if !editing}
		<div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
			{#each APPLICATION_TYPES as meta (meta.key)}
				<button
					type="button"
					onclick={() => chooseType(meta.key)}
					class="group rounded-2xl border p-4 text-left transition-all active:scale-[0.98] {type ===
					meta.key
						? 'border-apple bg-apple/[0.04] shadow-card'
						: 'border-black/[0.06] bg-white hover:border-apple/40 hover:bg-white/70'}"
				>
					<span
						class="flex h-9 w-9 items-center justify-center rounded-xl text-lg {type === meta.key
							? 'bg-apple/10'
							: 'bg-black/[0.04]'}"
					>
						{typeIcon[meta.key]}
					</span>
					<span class="mt-2.5 block text-[15px] font-medium text-neutral-900">{meta.label}</span>
					<span class="mt-0.5 block text-xs text-neutral-500">{meta.description}</span>
					<span
						class="mt-3 inline-flex items-center gap-1 text-xs font-medium {type === meta.key
							? 'text-apple'
							: 'text-neutral-400 group-hover:text-neutral-500'}"
					>
						{type === meta.key ? '已选择 ✓' : '选择'}
					</span>
				</button>
			{/each}
			{#if Object.keys(errors).length > 0}
				<div class="col-span-full rounded-xl bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
					请先修正下列 {Object.keys(errors).length} 处填写错误
				</div>
			{/if}
		</div>
	{/if}

	<div class="overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-card">
		<div class="border-b border-black/[0.05] px-6 py-4">
			<h2 class="text-[15px] font-semibold text-neutral-900">
				{step === 'form' ? '填写信息' : '预览确认'}
			</h2>
			<p class="mt-0.5 text-[13px] text-neutral-500">
				{step === 'form' ? '带 * 为必填项，填写完成后进入预览' : '点击有问题的字段可直接跳回修改'}
			</p>
		</div>

		<div class="px-6 py-6">
			{#if step === 'form'}
				<ApplicationForm {schemas} {values} {errors} onchange={handleChange} />
			{:else}
				<PreviewPanel {schemas} {values} {errors} onjump={focusField} />
			{/if}
		</div>

		<div
			class="flex items-center justify-between gap-3 border-t border-black/[0.05] bg-black/[0.02] px-6 py-4"
		>
			{#if step === 'form'}
				<button
					type="button"
					onclick={saveAsDraft}
					disabled={savingDraft}
					class="rounded-full px-4 py-2 text-sm text-neutral-500 transition-colors hover:bg-black/[0.05] hover:text-neutral-700 disabled:opacity-50"
				>
					{savingDraft ? '保存中…' : '存为草稿'}
				</button>
				<button
					type="button"
					onclick={gotoPreview}
					class="rounded-full bg-apple px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-apple-hover active:scale-[0.97]"
				>
					下一步：预览确认 →
				</button>
			{:else}
				<button
					type="button"
					onclick={() => (step = 'form')}
					class="rounded-full px-4 py-2 text-sm text-neutral-500 transition-colors hover:bg-black/[0.05] hover:text-neutral-700"
				>
					← 返回修改
				</button>
				<div class="flex items-center gap-3">
					{#if Object.keys(errors).length > 0}
						<span class="text-xs text-red-500">还有 {Object.keys(errors).length} 处待修正</span>
					{/if}
					<button
						type="button"
						onclick={submit}
						disabled={busy}
						class="rounded-full bg-apple px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-apple-hover active:scale-[0.97] disabled:opacity-60"
					>
						{busy ? '提交中…' : editing ? '保存并重新提交' : '提交申请'}
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
