import * as Bndr from 'bndr-js'
import {onMounted, onUnmounted, Ref} from 'vue'

export function useBndr(
	$element: Ref<null | HTMLElement>,
	fn: ($element: HTMLElement) => void
) {
	let dispose: ReturnType<typeof Bndr.createScope>

	onMounted(() => {
		if (!$element.value) throw new Error('No element')

		const $el = $element.value

		dispose = Bndr.createScope(() => {
			fn($el)
		})
	})

	onUnmounted(() => dispose?.())
}
