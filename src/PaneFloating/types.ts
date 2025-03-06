export type PaneDimension = number | 'minimized'

export type Position =
	| {anchor: 'maximized'}
	| {anchor: 'top'; height: PaneDimension}
	| {anchor: 'left-top'; width: PaneDimension; height: PaneDimension}
	| {anchor: 'left'; width: PaneDimension}
	| {anchor: 'left-bottom'; width: PaneDimension; height: PaneDimension}
	| {anchor: 'bottom'; height: PaneDimension}
	| {anchor: 'right-bottom'; width: PaneDimension; height: PaneDimension}
	| {anchor: 'right'; width: PaneDimension}
	| {anchor: 'right-top'; width: PaneDimension; height: PaneDimension}

export interface PaneFloatingProps {
	name: string
	icon: string
	position?: Position
}
