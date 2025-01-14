import {type MaybeComputedElementRef, useElementBounding} from '@vueuse/core'
import {scalar, vec2} from 'linearly'
import {computed} from 'vue'

export function useElementCenter(el: MaybeComputedElementRef) {
	const {left, top, right, bottom} = useElementBounding(el)

	return computed<vec2>(() => {
		return [
			scalar.lerp(left.value, right.value, 0.5),
			scalar.lerp(top.value, bottom.value, 0.5),
		]
	})
}
