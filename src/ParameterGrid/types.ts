import type {InjectionKey} from 'vue'

import type {MenuItem} from '../Menu'
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

/**
 * How deep a ParameterTreeItem is. Items nest through the `children` slot but
 * render flat, so that every value stays in the one column of the grid.
 */
export const ParameterTreeDepthKey: InjectionKey<number> = Symbol(
	'parameterTreeDepth'
)

export interface ParameterTreeProps {
	/** What to keep its label column's width under. */
	name: string
	/** The width of the label column, until it is resized. */
	labelWidth?: number
}

export interface ParameterTreeItemProps {
	label: string
	icon?: string
	hint?: TooltipValue
	/** Whether it has a chevron and shows its `children` slot while open. */
	expandable?: boolean
	selected?: boolean
	/**
	 * Items of a group can be dragged by the label to swap places, which emits
	 * `sort` on the one dropped on. `sortIndex` is its place in the group.
	 */
	sortGroup?: string
	sortIndex?: number
	/** The menu on the label. Right-clicking also selects. */
	menuItems?: MenuItem[]
}
