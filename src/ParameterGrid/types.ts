import type {InjectionKey} from 'vue'

import type {TooltipValue} from '../Tooltip/vTooltip'

export interface ParameterGroupProps {
	name: string
	label: string
	icon?: string
	/**
	 * Whether the heading folds the group away. When omitted, the container
	 * decides (ParameterGroupCollapsibleKey), and without one it is collapsible.
	 */
	collapsible?: boolean
}

/**
 * Provided by a container whose groups should (not) be collapsible — a
 * PaneTab shows one panel at a time, so there is nothing to fold out of the
 * way. A group's own `collapsible` prop wins.
 */
export const ParameterGroupCollapsibleKey: InjectionKey<boolean> = Symbol(
	'parameterGroupCollapsible'
)

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
