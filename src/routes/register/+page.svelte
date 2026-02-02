<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import { auth } from '$lib/auth.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let passwordConfirmation = $state('');
	let error = $state('');
	let fieldErrors = $state<Record<string, string[]>>({});
	let isSubmitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		fieldErrors = {};

		if (password !== passwordConfirmation) {
			fieldErrors = { password_confirmation: ['Passwords do not match'] };
			return;
		}

		isSubmitting = true;

		const response = await auth.register(name, email, password);

		if (response.success) {
			goto(`${base}/register/confirm`);
		} else if (response.error) {
			error = response.error.message;
			if (response.error.details) {
				fieldErrors = response.error.details;
			}
		}

		isSubmitting = false;
	}
</script>

<svelte:head>
	<title>Register - Space Wars 3002</title>
</svelte:head>

<AuthLayout>
	<form onsubmit={handleSubmit} class="auth-form">
		{#if error}
			<div class="error-banner">{error}</div>
		{/if}

		<div class="form-group">
			<input
				type="text"
				id="name"
				bind:value={name}
				required
				autocomplete="name"
				placeholder="Name"
				class:has-error={fieldErrors.name}
			/>
			{#if fieldErrors.name}
				<span class="field-error">{fieldErrors.name[0]}</span>
			{/if}
		</div>

		<div class="form-group">
			<input
				type="email"
				id="email"
				bind:value={email}
				required
				autocomplete="email"
				placeholder="Email"
				class:has-error={fieldErrors.email}
			/>
			{#if fieldErrors.email}
				<span class="field-error">{fieldErrors.email[0]}</span>
			{/if}
		</div>

		<div class="form-group">
			<input
				type="password"
				id="password"
				bind:value={password}
				required
				autocomplete="new-password"
				placeholder="Password"
				class:has-error={fieldErrors.password}
			/>
			{#if fieldErrors.password}
				<span class="field-error">{fieldErrors.password[0]}</span>
			{/if}
		</div>

		<div class="form-group">
			<input
				type="password"
				id="password-confirm"
				bind:value={passwordConfirmation}
				required
				autocomplete="new-password"
				placeholder="Confirm Password"
				class:has-error={fieldErrors.password_confirmation}
			/>
			{#if fieldErrors.password_confirmation}
				<span class="field-error">{fieldErrors.password_confirmation[0]}</span>
			{/if}
		</div>

		<div class="button-row">
			<a href="{base}/login" class="btn btn-back">Back to Login</a>
			<button type="submit" class="btn btn-register" disabled={isSubmitting}>
				{isSubmitting ? 'Creating...' : 'Register'}
			</button>
		</div>
	</form>
</AuthLayout>

<style>
	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgb(239, 68, 68);
		color: rgb(252, 165, 165);
		padding: 0.75rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.form-group input {
		background: #1a202c;
		border: 1px solid #4a5568;
		border-radius: 4px;
		padding: 0.625rem 0.75rem;
		color: #e2e8f0;
		font-size: 0.9rem;
		transition: border-color 0.2s;
	}

	.form-group input::placeholder {
		color: #718096;
	}

	.form-group input:focus {
		outline: none;
		border-color: #63b3ed;
	}

	.form-group input.has-error {
		border-color: rgb(239, 68, 68);
	}

	.field-error {
		font-size: 0.75rem;
		color: rgb(252, 165, 165);
	}

	.button-row {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.btn {
		flex: 1;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 0.9rem;
		text-align: center;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.btn-back {
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		color: #e2e8f0;
		border: 1px solid #1a202c;
	}

	.btn-back:hover {
		background: linear-gradient(to bottom, #718096, #4a5568);
	}

	.btn-register {
		background: linear-gradient(to bottom, #48bb78, #38a169);
		color: white;
		border: 1px solid #276749;
	}

	.btn-register:hover:not(:disabled) {
		background: linear-gradient(to bottom, #68d391, #48bb78);
	}

	.btn-register:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
