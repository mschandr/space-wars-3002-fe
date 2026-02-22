<script lang="ts">
	import StatBar from './StatBar.svelte';

	interface Props {
		hasShip: boolean;
		hull?: { current: number; max: number };
		shield?: { current: number; max: number; grade?: string };
		fuel?: { current: number; max: number; regenRate?: number };
		cargo?: { used: number; capacity: number };
		weapons?: number;
		sensors?: number;
		warpDrive?: number;
		shipClass?: string;
		shipStatus?: string;
		compact?: boolean;
		shipName?: string;
		shipUuid?: string;
		onRename?: (uuid: string, name: string) => Promise<boolean>;
		credits?: number;
		level?: number;
		experience?: number;
	}

	let {
		hasShip, hull, shield, fuel, cargo,
		weapons, sensors, warpDrive, shipClass, shipStatus,
		compact = false, shipName, shipUuid, onRename,
		credits, level, experience
	}: Props = $props();

	function formatCredits(value: number): string {
		return value.toLocaleString();
	}

	// Inline rename state
	let isEditing = $state(false);
	let editName = $state('');
	let isSubmitting = $state(false);
	let renameError = $state<string | null>(null);

	function startEditing() {
		if (!onRename || !shipUuid) return;
		editName = shipName ?? '';
		renameError = null;
		isEditing = true;
	}

	function cancelEditing() {
		isEditing = false;
		renameError = null;
	}

	async function submitRename() {
		const trimmed = editName.trim();
		if (!trimmed || !onRename || !shipUuid) return;
		if (trimmed === shipName) {
			isEditing = false;
			return;
		}

		isSubmitting = true;
		renameError = null;

		const success = await onRename(shipUuid, trimmed);

		if (success) {
			isEditing = false;
		} else {
			renameError = 'Rename failed — check credits or try again.';
		}

		isSubmitting = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') submitRename();
		else if (event.key === 'Escape') cancelEditing();
	}

	const displayName = $derived(shipName || 'Ship Status');

	// Fuel refill time: seconds until full, calculated from regenRate (units/hour)
	const fuelRefillSeconds = $derived.by(() => {
		if (!fuel || !fuel.regenRate || fuel.regenRate <= 0) return null;
		const deficit = fuel.max - fuel.current;
		if (deficit <= 0) return 0;
		return Math.ceil((deficit / fuel.regenRate) * 3600);
	});

	function formatRefillTime(seconds: number | null): string {
		if (seconds === null) return '--';
		if (seconds === 0) return 'FULL';
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		if (m >= 60) {
			const h = Math.floor(m / 60);
			const rm = m % 60;
			return `${h}h ${rm}m`;
		}
		return `${m}m ${s}s`;
	}

	// Status display color
	function statusColor(status?: string): string {
		switch (status) {
			case 'operational': return '#68d391';
			case 'damaged': return '#fbbf24';
			case 'critical': return '#fc8181';
			case 'destroyed': return '#e53e3e';
			case 'docked': return '#63b3ed';
			default: return '#a0aec0';
		}
	}
</script>

<aside class="player-stats" class:compact>
	<div class="stats-header">
		<span class="header-icon">&#9632;</span>
		{#if isEditing}
			<input
				class="rename-input"
				type="text"
				bind:value={editName}
				onkeydown={handleKeydown}
				maxlength={100}
				disabled={isSubmitting}
			/>
			<button class="rename-btn confirm" onclick={submitRename} disabled={isSubmitting} title="Confirm">
				{#if isSubmitting}...{:else}&#10003;{/if}
			</button>
			<button class="rename-btn cancel" onclick={cancelEditing} disabled={isSubmitting} title="Cancel">&#10007;</button>
		{:else}
			<span class="ship-name-display" title={shipName}>{displayName}</span>
			{#if onRename && shipUuid}
				<button class="rename-btn edit" onclick={startEditing} title="Rename ship">&#9998;</button>
			{/if}
		{/if}
	</div>

	{#if isEditing && !compact}
		<div class="rename-hints">
			<span class="fee-hint">Rename fee: 1,000 credits</span>
			{#if renameError}
				<span class="rename-error">{renameError}</span>
			{/if}
		</div>
	{/if}

	{#if credits != null}
		<div class="player-info" class:compact>
			<div class="info-row">
				<span class="credits-icon">C</span>
				<span class="credits-amount">{formatCredits(credits)}</span>
			</div>
			{#if compact}
				{#if level != null}
					<div class="info-row">
						<span class="level-badge">LVL {level}</span>
					</div>
				{/if}
			{:else}
				{#if level != null}
					<div class="info-row">
						<span class="level-badge">LVL {level}</span>
						{#if experience != null}
							<span class="xp-value">XP: {formatCredits(experience)}</span>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	{/if}

	{#if hasShip && hull && shield && fuel}
		<div class="stats-content">
			<StatBar label="Hull" current={hull.current} max={hull.max} color="red" />

			<StatBar
				label="Shield"
				current={shield.current}
				max={shield.max}
				color="blue"
				suffix={shield.grade}
			/>

			<StatBar label="Fuel" current={fuel.current} max={fuel.max} color="orange" />

			{#if cargo}
				<StatBar label="Cargo" current={cargo.used} max={cargo.capacity} color="green" />
			{/if}

			{#if !compact}
				<!-- Systems section -->
				<div class="systems-section">
					<div class="systems-header">Systems</div>
					<div class="systems-grid">
						<div class="sys-item">
							<span class="sys-label">Weapons</span>
							<span class="sys-value">{weapons ?? '--'}</span>
						</div>
						<div class="sys-item">
							<span class="sys-label">Sensors</span>
							<span class="sys-value">{sensors ?? '--'}</span>
						</div>
						<div class="sys-item">
							<span class="sys-label">Warp</span>
							<span class="sys-value">{warpDrive ?? '--'}</span>
						</div>
						<div class="sys-item">
							<span class="sys-label">Class</span>
							<span class="sys-value class-value">{shipClass ?? '--'}</span>
						</div>
					</div>
				</div>

				<!-- Ship info footer -->
				<div class="ship-footer">
					<!-- TODO(human): Implement component bonus display for utility slots -->
					<div class="footer-row">
						<span class="footer-label">Fuel Refill</span>
						<span class="footer-value" class:full={fuelRefillSeconds === 0}>{formatRefillTime(fuelRefillSeconds)}</span>
					</div>
					{#if shipStatus}
						<div class="footer-row">
							<span class="footer-label">Status</span>
							<span class="footer-value status-badge" style="color: {statusColor(shipStatus)}">{shipStatus.toUpperCase()}</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{:else}
		<div class="no-ship-content">
			<div class="no-ship-icon">&#128640;</div>
			<p class="no-ship-message">No Ship Assigned</p>
			<p class="no-ship-hint">Visit the Salvage Yard to purchase a ship</p>
		</div>
	{/if}
</aside>

<style>
	.player-stats {
		width: 220px;
		background: rgba(26, 32, 44, 0.95);
		border: 1px solid #4a5568;
		border-radius: 8px;
		overflow: hidden;
	}

	.player-stats.compact {
		width: 100%;
	}

	.player-stats.compact .stats-content {
		padding: 0.5rem;
	}

	.player-stats.compact .stats-header {
		padding: 0.35rem 0.6rem;
		font-size: 0.75rem;
	}

	.stats-header {
		background: linear-gradient(to bottom, #4a5568, #2d3748);
		padding: 0.5rem 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #e2e8f0;
		font-weight: 500;
		font-size: 0.85rem;
		border-bottom: 1px solid #1a202c;
	}

	.header-icon {
		color: #4299e1;
		font-size: 0.6rem;
	}

	.ship-name-display {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.rename-input {
		flex: 1;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid #4299e1;
		border-radius: 3px;
		color: #e2e8f0;
		font-size: 0.8rem;
		padding: 0.15rem 0.35rem;
		outline: none;
		min-width: 0;
	}

	.rename-input:focus {
		border-color: #63b3ed;
		box-shadow: 0 0 0 1px rgba(66, 153, 225, 0.3);
	}

	.rename-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.1rem 0.25rem;
		font-size: 0.8rem;
		line-height: 1;
		border-radius: 3px;
		flex-shrink: 0;
	}

	.rename-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.rename-btn.edit {
		color: #718096;
		font-size: 0.75rem;
	}

	.rename-btn.edit:hover {
		color: #a0aec0;
		background: rgba(255, 255, 255, 0.05);
	}

	.rename-btn.confirm {
		color: #68d391;
	}

	.rename-btn.confirm:hover {
		background: rgba(72, 187, 120, 0.15);
	}

	.rename-btn.cancel {
		color: #fc8181;
	}

	.rename-btn.cancel:hover {
		background: rgba(245, 101, 101, 0.15);
	}

	.rename-hints {
		padding: 0.25rem 0.75rem 0.35rem;
		background: rgba(26, 32, 44, 0.6);
		border-bottom: 1px solid #2d3748;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.fee-hint {
		font-size: 0.65rem;
		color: #a0aec0;
	}

	.rename-error {
		font-size: 0.65rem;
		color: #fc8181;
	}

	/* Player Info Section */
	.player-info {
		padding: 0.6rem 0.75rem;
		border-bottom: 1px solid #4a5568;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.player-info.compact {
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 0.35rem 0.6rem;
		gap: 0.5rem;
	}

	.info-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.credits-icon {
		color: #f6ad55;
		font-weight: 700;
		font-family: monospace;
		font-size: 0.8rem;
	}

	.credits-amount {
		color: #fbd38d;
		font-family: monospace;
		font-weight: 600;
		font-size: 0.85rem;
	}

	.level-badge {
		background: rgba(99, 179, 237, 0.2);
		color: #63b3ed;
		padding: 0.1rem 0.35rem;
		border-radius: 3px;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	.xp-value {
		color: #a0aec0;
		font-family: monospace;
		font-size: 0.7rem;
	}

	.stats-content {
		padding: 0.75rem;
	}

	/* Systems Section */
	.systems-section {
		margin-top: 0.75rem;
		padding-top: 0.6rem;
		border-top: 1px solid #4a5568;
	}

	.systems-header {
		font-size: 0.7rem;
		font-weight: 600;
		color: #718096;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.4rem;
	}

	.systems-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.4rem;
	}

	.sys-item {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.sys-label {
		font-size: 0.6rem;
		color: #718096;
		text-transform: uppercase;
	}

	.sys-value {
		font-size: 0.8rem;
		color: #e2e8f0;
		font-family: monospace;
	}

	.class-value {
		font-family: inherit;
		text-transform: capitalize;
		font-size: 0.75rem;
	}

	/* Ship Footer */
	.ship-footer {
		margin-top: 0.6rem;
		padding-top: 0.5rem;
		border-top: 1px solid #4a5568;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.footer-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.footer-label {
		font-size: 0.65rem;
		color: #718096;
		text-transform: uppercase;
	}

	.footer-value {
		font-size: 0.75rem;
		color: #e2e8f0;
		font-family: monospace;
	}

	.footer-value.full {
		color: #68d391;
	}

	.status-badge {
		font-weight: 600;
		font-size: 0.65rem;
		letter-spacing: 0.04em;
	}

	/* No Ship State */
	.no-ship-content {
		padding: 1.5rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.5rem;
	}

	.no-ship-icon {
		font-size: 2rem;
		opacity: 0.5;
	}

	.no-ship-message {
		font-size: 0.9rem;
		font-weight: 600;
		color: #e2e8f0;
		margin: 0;
	}

	.no-ship-hint {
		font-size: 0.75rem;
		color: #718096;
		margin: 0;
		line-height: 1.4;
	}
</style>
