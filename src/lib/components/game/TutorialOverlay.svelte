<script lang="ts">
	import { driver, type DriveStep, type Driver } from 'driver.js';
	import 'driver.js/dist/driver.css';
	import { page } from '$app/stores';
	import { tutorialState } from '$lib/stores/tutorialState.svelte';

	let driverObj: Driver | null = null;
	let pollTimer: ReturnType<typeof setTimeout> | null = null;

	function getPageFromUrl(pathname: string): 'galaxies' | 'play' | 'map' | null {
		if (pathname.includes('/play/map')) return 'map';
		if (pathname.includes('/play')) return 'play';
		if (pathname.includes('/galaxies') && !pathname.includes('/play')) return 'galaxies';
		return null;
	}

	function cleanup() {
		if (pollTimer !== null) {
			clearTimeout(pollTimer);
			pollTimer = null;
		}
		if (driverObj) {
			driverObj.destroy();
			driverObj = null;
		}
	}

	function injectSkipCheckbox(popover: { footerButtons: HTMLElement }) {
		const label = document.createElement('label');
		label.className = 'skip-tutorial-label';

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.className = 'skip-tutorial-checkbox';
		checkbox.addEventListener('change', () => {
			tutorialState.skip();
			cleanup();
		});

		const span = document.createElement('span');
		span.textContent = 'Skip Tutorial';

		label.appendChild(checkbox);
		label.appendChild(span);

		const footer = popover.footerButtons;
		footer.insertBefore(label, footer.firstChild);
	}

	function highlightStep(step: NonNullable<typeof tutorialState.currentStep>) {
		cleanup();

		driverObj = driver({
			overlayOpacity: 0.6,
			stagePadding: 8,
			stageRadius: 8,
			allowClose: false,
			showButtons: ['next'],
			disableActiveInteraction: step.disableActiveInteraction
		});

		const isActionStep = step.autoAdvance;

		const popoverConfig: DriveStep['popover'] = {
			title: `Step ${tutorialState.stepNumber} of ${tutorialState.totalSteps}`,
			description: step.message,
			side: step.driverSide ?? undefined,
			showButtons: isActionStep ? [] : ['next'],
			nextBtnText: step.id === 'tutorial_complete' ? 'Finish' : 'Next',
			onNextClick: (_el, _step, _opts) => {
				// Block advance on action steps — user must perform the action
				if (isActionStep) return;
				tutorialState.advance();
			},
			onPopoverRender: (popover, _opts) => {
				injectSkipCheckbox(popover);
				// Hide the previous button — tutorial is forward-only
				if (popover.previousButton) {
					popover.previousButton.style.display = 'none';
				}
				// Belt-and-suspenders: forcibly hide Next on action steps
				if (isActionStep && popover.nextButton) {
					popover.nextButton.style.display = 'none';
				}
			}
		};

		// No-element mode: centered popover over full overlay
		if (!step.driverElement) {
			driverObj.highlight({
				popover: popoverConfig
			});
			return;
		}

		const selector = `[data-tutorial="${step.driverElement}"]`;
		let attempts = 0;
		const maxAttempts = 50; // 50 × 200ms = 10s

		function poll() {
			const el = document.querySelector(selector);
			if (el && driverObj) {
				// Scroll element into view before highlighting
				el.scrollIntoView({ behavior: 'instant', block: 'nearest' });
				driverObj.highlight({
					element: selector,
					popover: popoverConfig
				});
			} else if (attempts < maxAttempts) {
				attempts++;
				pollTimer = setTimeout(poll, 200);
			}
		}

		// Small delay to let the DOM settle after step transitions
		pollTimer = setTimeout(poll, 50);
	}

	$effect(() => {
		const step = tutorialState.currentStep;
		const pathname = $page.url.pathname;
		const currentPage = getPageFromUrl(pathname);

		if (!step || currentPage !== step.page) {
			cleanup();
			return;
		}

		highlightStep(step);

		return () => cleanup();
	});
</script>

<style>
	/* driver.js space theme overrides */
	:global(.driver-popover) {
		background: linear-gradient(to bottom, #2d3748, #1a202c) !important;
		border: 1px solid #4a90a4 !important;
		border-radius: 8px !important;
		color: #e2e8f0 !important;
		max-width: 340px !important;
		min-width: 240px !important;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
	}

	:global(.driver-popover .driver-popover-title) {
		font-size: 0.7rem !important;
		color: #4a90a4 !important;
		text-transform: uppercase !important;
		letter-spacing: 0.05em !important;
		font-weight: 600 !important;
	}

	:global(.driver-popover .driver-popover-description) {
		color: #e2e8f0 !important;
		font-size: 0.85rem !important;
		line-height: 1.5 !important;
	}

	:global(.driver-popover .driver-popover-footer) {
		display: flex !important;
		justify-content: space-between !important;
		align-items: center !important;
		gap: 0.5rem !important;
	}

	:global(.driver-popover .driver-popover-footer button) {
		background: linear-gradient(to bottom, #4299e1, #3182ce) !important;
		border: 1px solid #2b6cb0 !important;
		color: white !important;
		padding: 0.375rem 0.75rem !important;
		border-radius: 4px !important;
		font-size: 0.8rem !important;
		font-weight: 600 !important;
		cursor: pointer !important;
		transition: all 0.15s !important;
	}

	:global(.driver-popover .driver-popover-footer button:hover) {
		background: linear-gradient(to bottom, #63b3ed, #4299e1) !important;
	}

	/* Hide the previous button — our tutorial is forward-only */
	:global(.driver-popover .driver-popover-prev-btn) {
		display: none !important;
	}

	/* Hide the close button — use skip checkbox instead */
	:global(.driver-popover .driver-popover-close-btn) {
		display: none !important;
	}

	:global(.driver-popover-arrow) {
		border-color: #4a90a4 !important;
	}

	:global(.driver-popover .skip-tutorial-label) {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.7rem;
		color: #718096;
		cursor: pointer;
		transition: color 0.15s;
	}

	:global(.driver-popover .skip-tutorial-label:hover) {
		color: #a0aec0;
	}

	:global(.driver-popover .skip-tutorial-checkbox) {
		width: 14px;
		height: 14px;
		cursor: pointer;
		accent-color: #4a90a4;
	}
</style>
