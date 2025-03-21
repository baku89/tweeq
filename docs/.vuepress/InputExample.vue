<script setup lang="ts" generic="T extends Record<string, unknown>">
import {cloneDeep} from 'lodash-es'
import {InputComplex} from 'tweeq'
import {ref, shallowRef} from 'vue'

import DemoContainer from './DemoContainer.vue'

interface Props {
	initialValue?: any
	scheme: any
	options: T
}

const props = defineProps<Props>()

const options = shallowRef<T>(cloneDeep(props.options))

const modelValue = ref(props.initialValue)

const listeners = {
	update: (value: any, ...args: any[]) => {
		// eslint-disable-next-line no-console
		console.info('update\t', value, ...args)
		modelValue.value = value
	},
	focus: (...args: any[]) => {
		// eslint-disable-next-line no-console
		console.info('focus\t', ...args)
	},
	blur: (...args: any[]) => {
		// eslint-disable-next-line no-console
		console.info('blur\t', ...args)
	},
	confirm: (...args: any[]) => {
		// eslint-disable-next-line no-console
		console.info('confirm\t', ...args)
	},
}
</script>

<template>
	<DemoContainer class="Example">
		<template #default="{isFullscreen}">
			<div class="input">
				<slot
					:modelValue="modelValue"
					:options="options"
					:listeners="listeners"
				/>
			</div>

			<div v-if="!isFullscreen" class="options">
				<InputComplex v-model="options" :scheme="scheme" />
			</div>
		</template>
	</DemoContainer>
</template>

<style lang="stylus" scoped>
.Example
	display grid
	grid-template-columns min-content 1fr
	gap 4rem

.input
	width 15rem
</style>
