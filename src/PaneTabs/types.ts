import type {ComputedRef, InjectionKey} from 'vue'

export interface PaneTabsProps {
	/** Key the active tab is stored under in the app config. */
	name: string
	/** Tab shown until the user picks one. Defaults to the first. */
	defaultTab?: string
}

export interface PaneTabProps {
	id: string
	/** Shown as the tooltip of the tab's icon. */
	label: string
	icon: string
}

export interface PaneTabsContext {
	activeId: ComputedRef<string | null>
	add(tab: PaneTabProps): void
	remove(tab: PaneTabProps): void
}

export const PaneTabsKey: InjectionKey<PaneTabsContext> = Symbol('paneTabs')
