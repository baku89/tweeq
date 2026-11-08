export interface InputNumberListProps {
	min?: number
	max?: number
	step?: number
	precision?: number
	suffix?: string
	/** How few there can be, below which none can be removed. */
	atLeast?: number
	/** What a new one starts as, if not as the last of them. */
	added?: number
	disabled?: boolean
}
