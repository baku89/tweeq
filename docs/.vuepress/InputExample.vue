<script setup lang="ts" generic="T extends Record<string, unknown>">
import {cloneDeep} from 'lodash-es'
import {InputButton, InputComplex, Scheme, Viewport} from 'tweeq'
import {ref, shallowRef} from 'vue'

interface Props {
	initialValue?: number | string | boolean
	scheme: Scheme<T>
	options: T
}

const props = defineProps<Props>()

const options = shallowRef<T>(cloneDeep(props.options))

const modelValue = ref(props.initialValue)

const isFullScreen = ref(false)

function fullScreen() {
	isFullScreen.value = !isFullScreen.value
}

const listeners = {
	update: (value: any) => {
		// eslint-disable-next-line no-console
		console.info('update\t', value)
		modelValue.value = value
	},
	focus: (e: Event) => {
		// eslint-disable-next-line no-console
		console.info('focus\t', e)
	},
	blur: (e: Event) => {
		// eslint-disable-next-line no-console
		console.info('blur\t', e)
	},
	confirm: () => {
		// eslint-disable-next-line no-console
		console.info('confirm\t')
	},
}
</script>

<template>
	<ClientOnly>
		<Viewport class="Example" :class="{'full-screen': isFullScreen}">
			<InputButton
				class="full-screen-button"
				:icon="isFullScreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'"
				:label="isFullScreen ? 'Exit Full Screen' : 'Full Screen'"
				subtle
				@click="fullScreen"
			/>
			<div class="input">
				<slot
					:modelValue="modelValue"
					:options="options"
					:listeners="listeners"
				/>
			</div>

			<div class="options">
				<InputComplex v-model="options" :scheme="scheme" />
			</div>
		</Viewport>
	</ClientOnly>
</template>

<style lang="stylus" scoped>
.Example
	position relative
	padding 4rem 0 2rem
	display grid
	grid-template-columns min-content 1fr
	gap 4rem
	background-color var(--tq-color-background)

	&.full-screen
		position fixed
		display flex
		flex-direction column
		justify-content center
		align-items center
		z-index 1000
		inset 0

		.options
			display none

.input
	width 15rem

.full-screen-button
	position absolute
	top 1rem
	right 0rem

	.full-screen &
		top 2rem
		right 2rem
</style>
