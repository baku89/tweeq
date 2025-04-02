import {OffsetOptions, Placement} from '@floating-ui/vue'
import {vec2} from 'linearly'

export interface PopoverProps {
	reference: HTMLElement | null
	open: boolean
	placement?: Placement | vec2
	offset?: OffsetOptions
	lightDismiss?: boolean
}
