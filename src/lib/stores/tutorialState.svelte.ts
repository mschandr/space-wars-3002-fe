const STORAGE_KEY = 'tutorial_state';
const STORAGE_VERSION = 2;

interface TutorialPersistence {
	version: number;
	completed: boolean;
	stepId: string;
}

export interface TutorialStep {
	id: string;
	page: 'galaxies' | 'play' | 'map';
	/** data-tutorial attribute value to highlight (null = no-element centered popover) */
	driverElement: string | null;
	/** Popover position relative to the element */
	driverSide: 'top' | 'bottom' | 'left' | 'right' | null;
	/** When true, driver.js absorbs clicks on the highlighted element */
	disableActiveInteraction: boolean;
	message: string;
	/** If true, the step advances via completeAction() instead of a Next button */
	autoAdvance: boolean;
}

const STEPS: TutorialStep[] = [
	{
		id: 'enter_game',
		page: 'galaxies',
		driverElement: 'galaxy-card-enter',
		driverSide: 'top',
		disableActiveInteraction: false,
		message: 'Your galaxy is ready! Click "Continue" Game to begin your ' + 
            'adventure.',
		autoAdvance: true
	},
	{
		id: 'enter_callsign',
		page: 'play',
		driverElement: 'callsign-input',
		driverSide: 'bottom',
		disableActiveInteraction: false,
		message: 'Choose a call sign — this is how other captains will know you ' + 
            'across the galaxy.',
		autoAdvance: false
	},
	{
		id: 'submit_callsign',
		page: 'play',
		driverElement: 'callsign-submit',
		driverSide: 'top',
		disableActiveInteraction: false,
		message: 'Click "Launch" to begin your journey!',
		autoAdvance: true
	},
	{
		id: 'game_overview',
		page: 'play',
		driverElement: 'game-main',
		driverSide: 'top',
		disableActiveInteraction: true,
		message:
			"Welcome to your star system, Commander. On the left you'll find the station menu — " +
			'each service opens in the center panel. When you get a ship, your ship stats will be on the right.',
		autoAdvance: false
	},
	{
		id: 'click_star_system',
		page: 'play',
		driverElement: 'menu-planets',
		driverSide: 'right',
		disableActiveInteraction: false,
		message: 'Click "Star System" to see planets and orbital bodies around '+
            'the star you are currently orbiting.',
		autoAdvance: true
	},
	{
		id: 'view_star_system',
		page: 'play',
		driverElement: 'action-panel',
		driverSide: 'left',
		disableActiveInteraction: true,
		message:
			'This panel shows the planets, moons, and other bodies orbiting your ' + 
            'star. Some planets are rich in minerals — keep an eye out for them.',
		autoAdvance: false
	},
	{
		id: 'click_warp_gates',
		page: 'play',
		driverElement: 'menu-warp',
		driverSide: 'right',
		disableActiveInteraction: false,
		message: 'Click Warp Gates to see connections to other systems.',
		autoAdvance: true
	},
	{
		id: 'view_warp_gates',
		page: 'play',
		driverElement: 'action-panel',
		driverSide: 'left',
		disableActiveInteraction: true,
		message:
			'Warp gates connect star systems. Use the sort buttons to find ' +
            "nearby destinations. You'll need fuel to travel - check your " + 
            'fuel gauge before jumping.',
		autoAdvance: false
	},
	{
		id: 'click_shipyard',
		page: 'play',
		driverElement: 'menu-shipyard',
		driverSide: 'right',
		disableActiveInteraction: false,
		message: 'Visit the Shipyard to get your first ship.',
		autoAdvance: true
	},
	{
		id: 'take_free_ship',
		page: 'play',
		driverElement: 'action-panel',
		driverSide: 'left',
		disableActiveInteraction: false,
		message:
			'The shipyard owner has a ship nobody wants — and it\'s free. Click "Take the Ship" to claim it.',
		autoAdvance: true
	},
	{
		id: 'click_trading_hub',
		page: 'play',
		driverElement: 'menu-trading_hub',
		driverSide: 'right',
		disableActiveInteraction: false,
		message: 'Click the Trading Hub — this is where you buy and sell minerals for profit.',
		autoAdvance: true
	},
	{
		id: 'view_trading_hub',
		page: 'play',
		driverElement: 'action-panel',
		driverSide: 'left',
		disableActiveInteraction: true,
		message:
			'Here you can trade minerals. Each system has different prices — buy low, sell high at another system to make a profit.',
		autoAdvance: false
	},
	{
		id: 'click_salvage_yard',
		page: 'play',
		driverElement: 'menu-salvage',
		driverSide: 'right',
		disableActiveInteraction: false,
		message: 'The Salvage Yard sells ship components — check it out.',
		autoAdvance: true
	},
	{
		id: 'view_salvage_yard',
		page: 'play',
		driverElement: 'action-panel',
		driverSide: 'left',
		disableActiveInteraction: true,
		message:
			'Salvage yards sell second-hand components: engines, shields, weapons. ' +
			'Install them to upgrade your ship.',
		autoAdvance: false
	},
	{
		id: 'review_ship_details',
		page: 'play',
		driverElement: 'player-stats',
		driverSide: 'left',
		disableActiveInteraction: true,
		message:
			'Your ship status is here — hull, shields, fuel, and cargo. ' +
			'Keep an eye on fuel before warping and hull in combat.',
		autoAdvance: false
	},
	{
		id: 'click_star_map',
		page: 'play',
		driverElement: 'btn-star-map',
		driverSide: 'bottom',
		disableActiveInteraction: false,
		message: 'Click Star Map to see the galaxy from above.',
		autoAdvance: true
	},
	{
		id: 'click_nearby_star',
		page: 'map',
		driverElement: 'map-area',
		driverSide: 'top',
		disableActiveInteraction: false,
		message: 'Click any star on the map to see its details in the sidebar.',
		autoAdvance: true
	},
	{
		id: 'review_star_details',
		page: 'map',
		driverElement: 'system-info-panel',
		driverSide: 'left',
		disableActiveInteraction: true,
		message:
			'The sidebar shows everything you know about a star — type, temperature, services, and travel cost. ' +
			'Stars you haven\'t visited appear dimmer.',
		autoAdvance: false
	},
	{
		id: 'click_warp_gates_2',
		page: 'play',
		driverElement: 'menu-warp',
		driverSide: 'right',
		disableActiveInteraction: false,
		message: 'Click Warp Gates — time to explore a new system!',
		autoAdvance: true
	},
	{
		id: 'warp_to_nearest',
		page: 'play',
		driverElement: 'warp-gate-first',
		driverSide: 'left',
		disableActiveInteraction: false,
		message: 'Click a warp gate to jump to a nearby system. Bon voyage, Commander!',
		autoAdvance: true
	},
	{
		id: 'tutorial_complete',
		page: 'play',
		driverElement: null,
		driverSide: null,
		disableActiveInteraction: false,
		message:
			"You've earned your wings, Commander. The galaxy is yours — " +
			'chart new systems, corner the mineral market, or just see what\'s out there.',
		autoAdvance: false
	}
];

/** Map step IDs to the menu actions that complete them */
const STEP_ACTION_MAP: Record<string, string> = {
	click_star_system: 'planets',
	click_warp_gates: 'warp',
	click_shipyard: 'shipyard',
	click_trading_hub: 'trading_hub',
	click_salvage_yard: 'salvage',
	click_warp_gates_2: 'warp'
};

class TutorialState {
	active = $state(false);
	stepIndex = $state(0);
	completed = $state(false);

	get currentStep(): TutorialStep | null {
		if (!this.active) return null;
		return STEPS[this.stepIndex] ?? null;
	}

	get totalSteps(): number {
		return STEPS.length;
	}

	get stepNumber(): number {
		return this.stepIndex + 1;
	}

	/** The menu item ID that's currently allowed during tutorial, or null if no restriction */
	get allowedMenuItem(): string | null {
		if (!this.active) return null;
		const step = this.currentStep;
		if (!step) return null;
		return STEP_ACTION_MAP[step.id] ?? null;
	}

	isCompleted(): boolean {
		const stored = this.loadFromStorage();
		return stored?.completed ?? false;
	}

	start() {
		this.active = true;
		this.stepIndex = 0;
		this.completed = false;
		this.persistStep();
	}

	restart() {
		this.completed = false;
		this.active = true;
		this.stepIndex = 0;
		this.persistStep();
	}

	advance() {
		if (!this.active) return;
		if (this.stepIndex >= STEPS.length - 1) {
			this.finish();
			return;
		}
		this.stepIndex++;
		this.persistStep();
	}

	/** Skip forward to a specific step (only if currently before it). */
	skipToStep(stepId: string) {
		if (!this.active) return;
		const targetIdx = STEPS.findIndex((s) => s.id === stepId);
		if (targetIdx === -1 || targetIdx <= this.stepIndex) return;
		this.stepIndex = targetIdx;
		this.persistStep();
	}

	/**
	 * Called by UI components when the user performs an action.
	 * If the action matches the current step, auto-advance.
	 */
	completeAction(actionId: string) {
		if (!this.active) return;
		const step = this.currentStep;
		if (!step) return;

		// Direct step ID match
		if (step.id === actionId && step.autoAdvance) {
			this.advance();
			return;
		}

		// Menu item selection match (e.g., selecting 'planets' completes 'click_star_system')
		const expectedMenu = STEP_ACTION_MAP[step.id];
		if (expectedMenu && expectedMenu === actionId && step.autoAdvance) {
			this.advance();
		}
	}

	/**
	 * Called by SystemMenu to check if a menu item should be enabled during tutorial.
	 * During the tutorial, only the step's target menu item is clickable.
	 */
	isMenuItemAllowed(itemId: string): boolean {
		if (!this.active) return true;
		const step = this.currentStep;
		if (!step) return true;

		// Steps that target a menu item — only that item is allowed
		const expectedMenu = STEP_ACTION_MAP[step.id];
		if (expectedMenu) return expectedMenu === itemId;

		// View steps on action-panel — lock the menu
		if (step.disableActiveInteraction && step.driverElement === 'action-panel') return false;

		// Non-menu steps (callsign, star map, map page, etc.) — allow all
		return true;
	}

	skip() {
		this.active = false;
		this.completed = true;
		this.saveToStorage({
			version: STORAGE_VERSION,
			completed: true,
			stepId: STEPS[this.stepIndex]?.id ?? 'skipped'
		});
	}

	resume() {
		if (this.active) return; // already running
		const stored = this.loadFromStorage();
		if (!stored || stored.completed) return;

		const idx = STEPS.findIndex((s) => s.id === stored.stepId);
		if (idx === -1) return; // unknown step — don't resume

		this.active = true;
		this.stepIndex = idx;
		this.completed = false;
	}

	persistStep() {
		const step = STEPS[this.stepIndex];
		if (!step) return;
		this.saveToStorage({
			version: STORAGE_VERSION,
			completed: false,
			stepId: step.id
		});
	}

	private finish() {
		this.active = false;
		this.completed = true;
		this.saveToStorage({
			version: STORAGE_VERSION,
			completed: true,
			stepId: 'tutorial_complete'
		});
	}

	private loadFromStorage(): TutorialPersistence | null {
		if (typeof localStorage === 'undefined') return null;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return null;
			const parsed = JSON.parse(raw) as TutorialPersistence;
			if (parsed.version !== STORAGE_VERSION) return null;
			return parsed;
		} catch {
			return null;
		}
	}

	private saveToStorage(data: TutorialPersistence) {
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
		} catch {
			// localStorage full or unavailable — silently ignore
		}
	}
}

export const tutorialState = new TutorialState();
