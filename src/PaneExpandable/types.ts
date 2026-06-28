import type {Placement} from '../Popover/types'

export interface PaneExpandableProps {
	/** Icon on the trigger button while collapsed. */
	icon: string
	/** Icon while expanded — a collapse affordance (defaults to a chevron). */
	openIcon?: string
	/**
	 * Controlled open state. Omit for uncontrolled (the component tracks its own
	 * open flag); pass it (with `@update:open`) to drive exclusivity between
	 * several panes.
	 */
	open?: boolean
	/** Where the panel opens relative to the button. */
	placement?: Placement
	/** Wrap the panel in a Balloon whose arrow points back at the button. */
	arrow?: boolean
	/**
	 * Make the panel persistent: it never opens on hover and never closes on an
	 * outside click or Esc (the native popover light-dismiss is turned off). The
	 * only toggle is an explicit click on the button, or the controlled `open`
	 * prop. Use for panels that should stay put until the user dismisses them.
	 */
	persistent?: boolean
}
