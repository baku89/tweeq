import type {MenuItem} from '../Menu'

export interface InputSeedProps {
	/** Rolled numbers are the whole numbers from 0 up to this. */
	range?: number
	/** What opens from the number. */
	menuItems?: MenuItem[]
	disabled?: boolean
}
