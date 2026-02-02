<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { auth } from '$lib/auth.svelte';

	onMount(() => {
		auth.initialize();
	});

	function handleLogout() {
		auth.logout();
		goto(`${base}/login`);
	}
</script>

<svelte:head>
	<title>Space Wars 3002</title>
</svelte:head>

<div class="home-container">
	<div class="home-card">
		<h1 class="title">SPACE WARS 3002</h1>
		<p class="subtitle">A Turn-Based Space Trading & Conquest Game</p>

		{#if auth.isLoading}
			<div class="loading">Loading...</div>
		{:else if auth.isAuthenticated}
			<div class="authenticated">
				<p class="welcome">Welcome back, <span class="username">{auth.user?.name}</span></p>
				<div class="actions">
					<a href="{base}/galaxies" class="btn btn-primary">Continue</a>
					<button class="btn btn-secondary" onclick={handleLogout}>Logout</button>
				</div>
			</div>
		{:else}
			<div class="actions">
				<a href="{base}/login" class="btn btn-primary">Login</a>
				<a href="{base}/register" class="btn btn-secondary">Register</a>
			</div>
		{/if}
	</div>
</div>

<style>
	.home-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.home-card {
		background: rgba(0, 0, 0, 0.85);
		border: 1px solid rgba(59, 130, 246, 0.5);
		border-radius: 0.5rem;
		padding: 3rem;
		text-align: center;
		box-shadow:
			0 0 30px rgba(59, 130, 246, 0.3),
			0 25px 50px -12px rgba(0, 0, 0, 0.5);
	}

	.title {
		font-size: 2.5rem;
		font-weight: 700;
		color: white;
		letter-spacing: 0.1em;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: rgb(156, 163, 175);
		margin-bottom: 2rem;
	}

	.loading {
		color: rgb(156, 163, 175);
		padding: 1rem;
	}

	.authenticated {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.welcome {
		color: rgb(209, 213, 219);
	}

	.username {
		color: rgb(251, 146, 60);
		font-weight: 600;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn {
		padding: 0.75rem 2rem;
		border-radius: 0.375rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		font-size: 1rem;
	}

	.btn-primary {
		background: linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235));
		color: white;
	}

	.btn-primary:hover {
		background: linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216));
		box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
	}

	.btn-secondary {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: rgb(209, 213, 219);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.5);
	}
</style>
