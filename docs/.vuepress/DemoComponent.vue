<script setup lang="ts" generic="T extends Record<string, unknown>">
import {useMagicKeys} from '@vueuse/core'
import {cloneDeep} from 'lodash-es'
import {Icon, InputComplex} from 'tweeq'
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

const {current} = useMagicKeys()
</script>

<template>
	<DemoContainer class="DemoComponent">
		<template #default="{isFullscreen}">
			<div class="input-wrapper" :class="{fullscreen: isFullscreen}">
				<div class="input">
					<slot
						:modelValue="modelValue"
						:options="options"
						:listeners="listeners"
					/>
				</div>
				<div v-if="isFullscreen" class="pressed-keys">
					<div v-for="key in current" :key="key">
						<Icon
							v-if="key === 'meta'"
							icon="material-symbols:keyboard-command-key"
						/>
						<Icon
							v-else-if="key === 'shift'"
							icon="material-symbols:shift-outline"
						/>
						<Icon
							v-else-if="key === 'alt'"
							icon="material-symbols:keyboard-option-key"
						/>
						<span v-else>{{ key.toUpperCase() }}</span>
					</div>
				</div>
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

.input-wrapper
	width 15rem

	&.fullscreen
		position relative
		width 640px
		height 480px
		display flex
		flex-direction column
		justify-content center
		align-items center
		outline 1px solid var(--tq-color-border)

.input
	min-width 15em

.pressed-keys
	position absolute
	bottom 2em
	display flex
	box-sizing border-box
	gap .5em
	font-family var(--tq-font-code)

	div
		height 36px
		font-size 24px
		font-size 24px
		background-color var(--tq-color-text-subtle)
		color var(--tq-color-background)
		border-radius var(--tq-radius-popup)
		padding 0 .4em 3px
		text-box trim-both cap alphabetic
		display flex
		align-items center

		span, svg
			display block
			vertical-align middle


			margin-top 3px


.options
	border-left 1px solid black
	margin-left 2rem
	padding-left 2rem
</style>
