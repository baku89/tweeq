import {computed, readonly, Ref, ref, watchSyncEffect} from 'vue'

import {Validator} from '../validator'

export function useValidator<T>(
	local: Readonly<Ref<T>>,
	validator: Validator<T>
) {
	const validateResult = computed(() => validator(local.value))
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
