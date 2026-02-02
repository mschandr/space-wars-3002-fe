<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="auth-container">
	<div class="auth-window">
		<div class="title-bar">
			<span class="title-icon">&#9733;</span>
			<span class="title-text">Space Wars 3002</span>
		</div>
		<div class="auth-card">
			<h1 class="auth-title">Welcome to Space Wars 3002</h1>
			{@render children()}
		</div>
	</div>
</div>

<style>
	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-image: url('/nursery.jpg.webp');
		background-size: cover;
		background-position: center;
		background-attachment: fixed;
		padding: 1rem;
	}

	.auth-window {
		width: 100%;
		max-width: 400px;
		border-radius: 8px;
		overflow: hidden;
		box-shadow:
			0 0 0 1px rgba(100, 120, 140, 0.5),
			0 4px 20px rgba(0, 0, 0, 0.5);
	}

	.title-bar {
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		padding: 0.5rem 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-bottom: 1px solid #1a202c;
	}

	.title-icon {
		color: #f6ad55;
		font-size: 1rem;
	}

	.title-text {
		color: #e2e8f0;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.auth-card {
		background: rgba(26, 32, 44, 0.95);
		padding: 1.5rem 2rem 2rem;
	}

	.auth-title {
		font-size: 1.25rem;
		font-weight: 600;
		text-align: center;
		color: #e2e8f0;
		margin-bottom: 1.5rem;
	}
</style>
