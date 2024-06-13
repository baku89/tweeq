<script setup lang="ts">
import {ref, toRaw} from 'vue'

import InputButton from '../InputButton.vue'
import InputComplex, {Scheme} from '../InputComplex'
import PaneModal from '../PaneModal'
import {useModalStore} from '../stores/modal'
import {ShowOptions} from './types'

const modal = useModalStore()

const $modal = ref<typeof PaneModal | null>(null)

const desc = ref<{
	defaultValue: any
	scheme: Scheme<any>
	options?: ShowOptions
} | null>(null)

function updateModelValue(value: any) {
	desc.value!.defaultValue = value
}

let endEdit: (value: any | null) => void

modal.prompt = <T extends Record<string, unknown>>(
	defaultValue: T,
	scheme: Scheme<T>,
	options?: ShowOptions
): Promise<T | null> => {
	desc.value = {scheme, defaultValue, options}
	$modal.value!.toggleShow(true)

	return new Promise(resolve => (endEdit = resolve))
}

function onAbort() {
	desc.value = null
	endEdit(null)
}

function onConfirm() {
	$modal.value!.toggleShow(false)

	const {defaultValue} = desc.value!
	desc.value = null

	endEdit(toRaw(defaultValue))
}

defineExpose({
	prompt,
})
</script>

<template>
	<PaneModal ref="$modal" @close="onAbort">
		<div v-if="desc" class="PaneModalComplex">
			<InputComplex
				:title="desc.options?.title"
				:scheme="desc.scheme"
				:modelValue="desc.defaultValue"
				@update:modelValue="updateModelValue"
			/>
			<InputButton label="Save" @click="onConfirm" />
		</div>
	</PaneModal>
</template>

<style lang="stylus" scoped>
.PaneModalComplex
	display grid
	gap 12px
</style>
