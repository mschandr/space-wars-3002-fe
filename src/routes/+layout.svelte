<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import SpaceBackdrop from '$lib/components/SpaceBackdrop.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SpaceBackdrop />
{@render children?.()}
