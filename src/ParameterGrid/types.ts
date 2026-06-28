import type {TooltipValue} from '../Tooltip/vTooltip'

export interface ParameterGroupProps {
	name: string
	label: string
	icon?: string
}

export interface ParameterProps {
	label?: string
	icon?: string
	/**
	 * Explanatory tooltip shown when hovering the label — handy for cryptic
	 * abbreviations ("Apr.", "C.Temp."). A bare string shows as plain text (the
	 * spelled-out term, e.g. "Aperture"); pass `{title, description}` for the
	 * structured two-line layout, or `{content, html}` for rich markup.
	 */
	hint?: TooltipValue
}
