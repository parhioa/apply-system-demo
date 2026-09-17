<script lang="ts">
	import { STATUS_META } from '$lib/config/schemas';
	import type { ApplicationStatus } from '$lib/types';

	let { status }: { status: ApplicationStatus } = $props();
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur {STATUS_META[
		status
	].tag}"
>
	<span class="h-1.5 w-1.5 rounded-full {STATUS_META[status].dot}"></span>
	{STATUS_META[status].label}
</span>
