import type {ComputedRef, InjectionKey} from 'vue'

import type {MenuItems} from '../Menu'
import type {TooltipValue} from '../Tooltip/vTooltip'
import type {TreeDropPosition} from './treeDrop'

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

/** What an item tells its tree, for a drag to work out where it could land. */
export interface ParameterTreeItemHandle {
	readonly depth: number
	id(): string | undefined
	open(): boolean
	expandable(): boolean
	element(): HTMLElement | undefined
}

export const ParameterTreeContextKey: InjectionKey<{
	register(item: ParameterTreeItemHandle): () => void
	insideId: ComputedRef<string | null>
	/** The width of the value column, or 0 until it has been measured. */
	valueWidth: ComputedRef<number>
}> = Symbol('parameterTreeContext')

export interface ParameterTreeProps {
	/** What to keep its label column's width under. */
	name: string
	/** The width of the label column, until it is resized. */
	labelWidth?: number
	/**
	 * Whether `source` can go `position` of `target`. Without it, items cannot be
	 * dragged around the tree. Items with a `dragId` are what can be dragged.
	 */
	canDrop?: (
		source: string,
		target: string,
		position: TreeDropPosition
	) => boolean
}

export interface ParameterTreeItemProps {
	label: string
	icon?: string
	hint?: TooltipValue
	/** Whether it has a chevron and shows its `children` slot while open. */
	expandable?: boolean
	selected?: boolean
	/** The label is what drags the item, in a `handleless` InputArray. */
	sortHandle?: boolean
	/** The label drags the item around its ParameterTree, which knows it by this. */
	dragId?: string
	/** Its label is a name that is there to be changed, by setting `renaming`. */
	renamable?: boolean
	/** A + at the end of the label, which emits `add`. Says what it adds. */
	addLabel?: string
	/** What to edit, while `renaming`, if it is not the label as shown. */
	labelSource?: string
	/** Whether a name is fine, while `renaming`. */
	canRename?: (name: string) => boolean
	/** What a space goes in as, while `renaming`, for a name that cannot have one. */
	renameSpaceAs?: string
	/** The label stands out from those of the others. */
	emphasized?: boolean
	/** The guide along its children curves in at both ends, like a `(`. */
	closedGuide?: boolean
	/** The menu on the label. Right-clicking also selects. */
	menuItems?: MenuItems
}
