<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/stores/auth';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	onMount(() => {
		goto(get(currentUser) ? '/list' : '/login');
	});
</script>
