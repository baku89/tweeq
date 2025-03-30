import {type Ref, ref, watch} from 'vue'

/**
 * Returns a ref that tracks which ref was turned on last among multiple boolean refs. If the all of the refs are false, the ref will be null.
 * @param refs Record of boolean refs to track
 * @returns Ref containing the key of the last true ref, or null if all are false
 */
export function useLastActive<T extends Record<string, Ref<boolean>>>(
	refs: T
): Ref<keyof T | null> {
	const lastActive = ref<keyof T | null>(null)

	const entries = Object.entries(refs) as [keyof T, Ref<boolean>][]

	for (const [key, value] of entries) {
		watch(value, () => {
			if (value.value) {
				lastActive.value = key
			} else if (lastActive.value === key) {
				const anyActive = entries.find(([, v]) => v.value)
				lastActive.value = anyActive?.[0] ?? null
			}
		})
	}

	return lastActive as Ref<keyof T | null>
}
