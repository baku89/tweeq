import {uniqueId} from 'lodash-es'
import {
	computed,
	type MaybeRefOrGetter,
	onBeforeUnmount,
	shallowRef,
	unref,
	watchEffect,
} from 'vue'

const styles = shallowRef<Map<string, string | null>>(new Map())

const currentStyle = computed(() => {
	for (const style of styles.value.values()) {
		if (style !== null) return style
	}
	return 'inherit'
})

watchEffect(() => {
	document.documentElement.style.cursor = currentStyle.value
})

export function useCursorStyle(
	cursor: MaybeRefOrGetter<string | null> | (() => string | null)
) {
	const cursorRef: MaybeRefOrGetter =
		typeof cursor === 'function' ? computed(cursor) : cursor

	const id = uniqueId()

	watchEffect(() => {
		styles.value.set(id, unref(cursorRef))
	})

	onBeforeUnmount(() => {
		styles.value.delete(id)
	})
}
