<script lang="ts">
	import { onMount } from 'svelte';
	import ApplicationWizard from '$lib/components/ApplicationWizard.svelte';
	import { getApplicationById } from '$lib/services/applicationApi';
	import type { ApplicationItem } from '$lib/types';

	let { params } = $props();

	let item: ApplicationItem | null = $state(null);
	let notFound = $state(false);

	onMount(async () => {
		item = await getApplicationById(params.id);
		if (!item) notFound = true;
	});
</script>

{#if notFound}
	<div class="py-20 text-center text-sm text-slate-400">申请不存在</div>
{:else if !item}
	<div class="py-20 text-center text-sm text-slate-400">加载中…</div>
{:else}
	<ApplicationWizard existing={item} />
{/if}
