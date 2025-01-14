import {
	type MaybeElement,
	type MaybeElementRef,
	unrefElement,
	type UnRefElementReturn,
} from '@vueuse/core'
import * as Bndr from 'bndr-js'
import {onBeforeUnmount, onMounted} from 'vue'

export function useBndr<T extends MaybeElement>(
	$element: MaybeElementRef<T>,
	fn: ($element: NonNullable<UnRefElementReturn<T>>) => void
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
