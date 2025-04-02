<script setup lang="ts">
import {ref} from 'vue'

import {InputButton} from '../InputButton'
import {InputComplex, type Scheme} from '../InputComplex'
import {PaneModal} from '../PaneModal'
import {useModalStore} from '../stores/modal'
import type {ShowOptions} from './types'

const modal = useModalStore()

const desc = ref<{
	value: any
	initialValue: any
	scheme: Scheme<any>
	options?: ShowOptions
} | null>(null)

const open = ref(false)

function onUpdate(value: any) {
	desc.value!.value = value
	onInput?.(value)
}

let onInput: ((value: any) => void) | undefined = undefined
let endEdit: (value: any) => void

modal.prompt = <T extends Record<string, unknown>>(
	value: T,
	scheme: Scheme<T>,
	options?: ShowOptions<T>
): Promise<T> => {
	if (desc.value) {
		endEdit(desc.value.initialValue)
	}

	desc.value = {scheme, value, initialValue: value, options}
	onInput = options?.onInput
	open.value = true

	return new Promise(resolve => {
		endEdit = (value: any) => {
			open.value = false
			endEdit = () => {}
			resolve(value)
		}
	})
}

function onAbort() {
	endEdit(desc.value!.initialValue)
}

function onConfirm() {
	endEdit(desc.value!.value)
}

defineExpose({
	prompt,
})
</script>

<template>
	<PaneModal v-model:open="open" @close="onAbort">
		<div v-if="desc" class="TqPaneModalComplex">
			<InputComplex
				:title="desc.options?.title"
				:scheme="desc.scheme"
				:modelValue="desc.value"
				@update:modelValue="onUpdate"
			/>
			<InputButton label="Save" @click="onConfirm" />
		</div>
	</PaneModal>
</template>

<style lang="stylus" scoped>
.TqPaneModalComplex
	display grid
	gap 12px
</style>
