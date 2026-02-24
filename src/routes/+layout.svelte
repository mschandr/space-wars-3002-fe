<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import SpaceBackdrop from '$lib/components/SpaceBackdrop.svelte';
	import TutorialOverlay from '$lib/components/game/TutorialOverlay.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<SpaceBackdrop />
{@render children?.()}
<TutorialOverlay />
