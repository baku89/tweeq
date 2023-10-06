<script lang="ts" setup generic="T">
import {Icon} from '@iconify/vue'
import {useElementSize} from '@vueuse/core'
import {search} from 'fast-fuzzy'
import {computed, Ref, ref, watch} from 'vue'

import InputString from './InputString'
import Popover from './Popover.vue'
import {
	InputAlign,
	InputFont,
	InputTheme,
	LabelizerProps,
	useLabelizer,
} from './types'
import {unsignedMod} from './util'

interface Props extends LabelizerProps<T> {
	modelValue: T
	theme?: InputTheme
	font?: InputFont
	align?: InputAlign
}

const props = withDefaults(defineProps<Props>(), {
	prefix: '',
	suffix: '',
})

const labelizer = useLabelizer(props)

const emit = defineEmits<{
	'update:modelValue': [value: T]
}>()

defineOptions({
	inheritAttrs: false,
})

const open = ref(false)
const $root = ref<null | HTMLElement>(null)

const {width: inputWidth} = useElementSize($root)

const startValue = ref(props.modelValue) as Ref<T>
const display = ref(labelizer.value(props.modelValue))
const displayEdited = ref(false)

watch(
	() => [open.value, props.modelValue] as const,
	([open, modelValue]) => {
		if (open) return
		display.value = labelizer.value(modelValue)
		displayEdited.value = false
	}
)

watch(open, (open, oldOpen) => {
	if (open && !oldOpen) {
		startValue.value = props.modelValue
	}
})

const filteredOptions = computed(() => {
	if (display.value === '' || !displayEdited.value) return props.options

	const ret = search(display.value, props.options as any[], {
		keySelector: labelizer.value,
	}) as T[]

	return ret
})

watch(filteredOptions, filteredOptions => {
	if (!filteredOptions.includes(props.modelValue)) {
		emit('update:modelValue', filteredOptions[0])
	}
})

function onInput() {
	displayEdited.value = true
	open.value = true
}

function onSelect(option: T, e: PointerEvent) {
	if (e.type === 'pointerdown' && e.isPrimary) {
		open.value = false
	}
	emit('update:modelValue', option)
}

function onUnselect() {
	emit('update:modelValue', startValue.value)
}

function onPressArrow(isUp: boolean) {
	const length = filteredOptions.value.length
	const index = filteredOptions.value.indexOf(props.modelValue)
	const newIndex = unsignedMod(index + (isUp ? -1 : 1), length)
	const option = filteredOptions.value[newIndex]
	emit('update:modelValue', option)
}
</script>

<template>
	<div
		ref="$root"
		class="InputDropdown"
		:class="{open}"
		v-bind="$attrs"
		:align="align"
	>
		<InputString
			v-model="display"
			:theme="theme"
			:font="font"
			:align="align"
			:forceUpdateOnFocusing="true"
			class="input"
			@focus="open = true"
			@blur="open = false"
			@input="onInput"
			@keydown.enter.prevent="open = !open"
			@keydown.up.prevent="onPressArrow(true)"
			@keydown.down.prevent="onPressArrow(false)"
		/>
		<Icon class="chevron" icon="mdi:unfold-more-horizontal" />
		<Popover v-model:open="open" :reference="$root" placement="bottom">
			<ul
				class="select"
				:style="{width: inputWidth + 'px'}"
				:font="font"
				:align="align"
				@pointerleave="open && onUnselect()"
			>
				<li
					v-for="(item, index) in filteredOptions"
					:key="index"
					class="option"
					:class="{
						active: item === modelValue,
						startValue: item === startValue,
					}"
					@pointerdown="onSelect(item, $event)"
					@pointerenter="onSelect(item, $event)"
				>
					<slot name="option" :item="item">
						{{ labelizer(item) }}
					</slot>
				</li>
			</ul>
		</Popover>
	</div>
</template>

<style lang="stylus" scoped>
@import './common.styl'

$right-arrow-width = 1em

.InputDropdown
	position relative
	display inline-block
	width 100%
	height var(--tq-input-height)
	border-radius var(--tq-input-border-radius)

	&.open .input
		background var(--tq-color-primary-container)

.select
	margin 1px
	padding 0
	background var(--tq-color-input)
	border-radius var(--tq-input-border-radius)
	overflow hidden

	use-input-align()
	use-input-font()

.option
	padding 0 12px
	height var(--tq-input-height)
	line-height var(--tq-input-height)

	&.startValue
		background var(--tq-color-primary-container)

	&.active
		background var(--tq-color-primary)
		color var(--tq-color-on-primary)

.chevron
	position absolute
	top 0
	z-index 10
	right 2px
	width calc(.8 * var(--tq-input-height))
	height 100%
	pointer-events none
	color var(--tq-color-gray-on-background)
	opacity .4
	hover-transition(opacity)

	.InputDropdown:hover &
		opacity 1
</style>
