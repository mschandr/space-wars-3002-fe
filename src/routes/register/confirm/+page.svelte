<script lang="ts">
	import { base } from '$app/paths';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
</script>

<svelte:head>
	<title>Registration Complete - Space Wars 3002</title>
</svelte:head>

<AuthLayout>
	<div class="confirm-content">
		<div class="success-icon">&#10003;</div>
		<h2>Registration Complete!</h2>
		<p>Your account has been created successfully.</p>
		<p class="hint">Check your email to verify your account.</p>
		<a href="{base}/login" class="btn btn-login">Continue to Login</a>
	</div>
</AuthLayout>

<style>
	.confirm-content {
		text-align: center;
	}

	.success-icon {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: linear-gradient(to bottom, #48bb78, #38a169);
		color: white;
		font-size: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5rem;
	}

	h2 {
		color: #e2e8f0;
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	p {
		color: #a0aec0;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}

	.hint {
		color: #718096;
		font-size: 0.85rem;
		margin-bottom: 1.5rem;
	}

	.btn-login {
		display: inline-block;
		background: linear-gradient(to bottom, #4299e1, #3182ce);
		color: white;
		border: 1px solid #2b6cb0;
		padding: 0.5rem 1.5rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.9rem;
		text-decoration: none;
		transition: all 0.2s;
	}

	.btn-login:hover {
		background: linear-gradient(to bottom, #63b3ed, #4299e1);
	}
</style>
