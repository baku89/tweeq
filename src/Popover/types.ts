import {vec2} from 'linearly'

export type PlacementDirection = 'top' | 'right' | 'bottom' | 'left'
export type PlacementAlign = 'start' | 'end'
export type Placement =
	| vec2
	| PlacementDirection
	| `${PlacementDirection}-${PlacementAlign}`

export interface PopoverProps {
	reference: HTMLElement | undefined
	open: boolean
	placement?: Placement
	lightDismiss?: boolean
}
