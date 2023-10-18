<script setup lang="ts">
import {ref, toRaw} from 'vue'

import InputButton from '../InputButton.vue'
import InputComplex, {Scheme} from '../InputComplex'
import PaneModal from '../PaneModal'

const $modal = ref<typeof PaneModal | null>(null)

interface ShowOptions {
	readonly title?: string
}

const desc = ref<{
	defaultValue: any
	scheme: Scheme<any>
	options?: ShowOptions
} | null>(null)

function updateModelValue(value: any) {
	desc.value!.defaultValue = value
}

let endEdit: (value: any | null) => void

function show<T>(
	defaultValue: T,
	scheme: Scheme<T>,
	options?: ShowOptions
): Promise<T | null> {
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
	show,
})
</script>

<template>
	<PaneModal ref="$modal" @close="onAbort">
		<div v-if="desc" class="PaneModalParameters">
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
