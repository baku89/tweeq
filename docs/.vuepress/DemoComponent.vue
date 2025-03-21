<script setup lang="ts" generic="T extends Record<string, unknown>">
import {cloneDeep} from 'lodash-es'
import {InputComplex} from 'tweeq'
import {ref, shallowRef} from 'vue'

import DemoContainer from './DemoContainer.vue'

interface Props {
	name: string
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
		console.info(`[${props.name}] update\t`, value, ...args)
		modelValue.value = value
	},
	focus: (...args: any[]) => {
		// eslint-disable-next-line no-console
		console.info(`[${props.name}] focus\t`, ...args)
	},
	blur: (...args: any[]) => {
		// eslint-disable-next-line no-console
		console.info(`[${props.name}] blur\t`, ...args)
	},
	confirm: (...args: any[]) => {
		// eslint-disable-next-line no-console
		console.info(`[${props.name}] confirm\t`, ...args)
	},
}
</script>

<template>
	<DemoContainer class="DemoComponent">
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
.DemoComponent
	display grid
	grid-template-columns min-content 1fr

.input
	width 15rem

.options
	border-left 1px solid black
	margin-left 2rem
	padding-left 2rem
</style>
