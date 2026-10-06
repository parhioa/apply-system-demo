<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser } from '../stores/auth';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';

	onMount(() => {
		console.log('page mounted');
		goto(get(currentUser) ? '/list' : '/login');
	});
</script>
