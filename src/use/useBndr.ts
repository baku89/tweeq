import {MaybeElementRef, unrefElement} from '@vueuse/core'
import * as Bndr from 'bndr-js'
import {onBeforeUnmount, onMounted} from 'vue'

export function useBndr(
	$element: MaybeElementRef,
	fn: ($element: HTMLElement | SVGElement) => void
) {
	let dispose: ReturnType<typeof Bndr.createScope> | undefined

	onMounted(() => {
		const $el = unrefElement($element)

		if (!$el) return

		dispose = Bndr.createScope(() => {
			fn($el)
		})
	})

	onBeforeUnmount(() => {
		dispose?.()
		dispose = undefined
	})
}
