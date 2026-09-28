export interface IconIndicatorProps {
	active?: boolean
	icon: string
	/**
	 * Size the indicator to the nested icon size (--tq-icon-size) instead of a
	 * full input slot, for placing it inline alongside text (e.g. before a label).
	 */
	inline?: boolean
	/**
	 * Light the icon up while active — a soft halo in the accent colour, like
	 * a device's power lamp — instead of only tinting it. For indicators whose
	 * active state means "something is physically on / connected".
	 */
	glow?: boolean
}
