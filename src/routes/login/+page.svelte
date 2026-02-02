<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import AuthLayout from '$lib/components/AuthLayout.svelte';
	import { auth } from '$lib/auth.svelte';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let error = $state('');
	let fieldErrors = $state<Record<string, string[]>>({});
	let isSubmitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		fieldErrors = {};
		isSubmitting = true;

		const response = await auth.login(email, password);

		if (response.success) {
			goto(`${base}/galaxies`);
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
	<title>Login - Space Wars 3002</title>
</svelte:head>

<AuthLayout>
	<form onsubmit={handleSubmit} class="auth-form">
		{#if error}
			<div class="error-banner">{error}</div>
		{/if}

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
				autocomplete="current-password"
				placeholder="Password"
				class:has-error={fieldErrors.password}
			/>
			{#if fieldErrors.password}
				<span class="field-error">{fieldErrors.password[0]}</span>
			{/if}
		</div>

		<div class="form-row">
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={rememberMe} />
				<span>Remember Me</span>
			</label>
		</div>

		<div class="button-row">
			<button type="submit" class="btn btn-login" disabled={isSubmitting}>
				{isSubmitting ? 'Logging in...' : 'Login'}
			</button>
			<a href="{base}/register" class="btn btn-register">Register</a>
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

	.form-row {
		display: flex;
		align-items: center;
		margin-top: 0.25rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #a0aec0;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.checkbox-label input[type='checkbox'] {
		width: 1rem;
		height: 1rem;
		accent-color: #4299e1;
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

	.btn-login {
		background: linear-gradient(to bottom, #4299e1, #3182ce);
		color: white;
		border: 1px solid #2b6cb0;
	}

	.btn-login:hover:not(:disabled) {
		background: linear-gradient(to bottom, #63b3ed, #4299e1);
	}

	.btn-login:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-register {
		background: linear-gradient(to bottom, #c53030, #9b2c2c);
		color: white;
		border: 1px solid #822727;
	}

	.btn-register:hover {
		background: linear-gradient(to bottom, #e53e3e, #c53030);
	}
</style>
