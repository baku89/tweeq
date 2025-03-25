import {
	computed,
	MaybeRef,
	readonly,
	Ref,
	ref,
	unref,
	watchSyncEffect,
} from 'vue'

import {Validator} from '../validator'

export function useValidator<T>(
	local: Readonly<Ref<T>>,
	validator: MaybeRef<Validator<T>>
) {
	const validateResult = computed(() => unref(validator)(local.value))
	const validLocal = ref<T>()

	watchSyncEffect(() => {
		if (validateResult.value.value === undefined) return

		validLocal.value = validateResult.value.value
	})

	return {
		validLocal: readonly(validLocal),
		validateResult,
	}
}
