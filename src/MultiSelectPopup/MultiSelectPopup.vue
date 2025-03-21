<script setup lang="ts">
import {autoUpdate, useFloating} from '@floating-ui/vue'
import {computed, onMounted, shallowRef, toRef, watchEffect} from 'vue'

import {Icon} from '../Icon'
import {MultiSelectType, useMultiSelectStore} from '../stores/multiSelect'
import MultiSelectButton from './MultiSelectButton.vue'
import MultiSelectHorizontalSlider from './MultiSelectHorizontalSlider.vue'

const multiSelect = useMultiSelectStore()

const selectedTypes = computed(() =>
	multiSelect.selectedInputs.map(i => i.type)
)

const $root = shallowRef<HTMLElement | null>(null)

onMounted(() => {
	if (!$root.value) return
	multiSelect.setPopupEl($root.value)
})

const {floatingStyles} = useFloating(
	toRef(multiSelect, 'focusedElement'),
	$root,
	{placement: 'bottom-end', whileElementsMounted: autoUpdate}
)

type MultiSelectAction = {
	enabled: (types: MultiSelectType[]) => boolean
	icon: string
} & (
	| {
			type: 'slider'
			updator: (px: number) => (values: any[]) => any[]
	  }
	| {
			type: 'button'
			updator: (values: any[]) => any[]
	  }
)

const actions: MultiSelectAction[] = [
	{
		type: 'slider',
		enabled: types => types.every(t => t === 'number'),
		updator: (px: number) => (values: number[]) => values.map(v => v + px / 10),
		icon: 'material-symbols:add',
	},
	{
		type: 'slider',
		enabled: types => types.every(t => t === 'number'),
		updator: (px: number) => (values: number[]) =>
			values.map(v => v * (px / 100 + 1)),
		icon: 'mdi:multiply',
	},
	{
		type: 'button',
		enabled: types => types.length === 2 && types[0] === types[1],
		updator: values => values.reverse(),
		icon: 'material-symbols:swap-vert',
	},
]

const enabledActions = computed(() =>
	actions.filter(a => a.enabled(selectedTypes.value))
)

const visible = computed(() => {
	if (multiSelect.selectedInputs.length <= 1) return false
	if (enabledActions.value.length === 0) return false

	return true
})

watchEffect(() => {
	$root.value?.togglePopover(visible.value)
})
</script>

<template>
	<div
		ref="$root"
		:class="{visible}"
		class="TqMultiSelectPopup"
		:style="floatingStyles"
		popover="manual"
	>
		<Icon class="tune-icon" icon="lsicon:control-filled" />
		<template v-for="action in enabledActions" :key="action.icon">
			<MultiSelectHorizontalSlider
				v-if="action.type === 'slider'"
				:updator="action.updator"
				:icon="action.icon"
			/>
			<MultiSelectButton
				v-else-if="action.type === 'button'"
				:updator="action.updator"
				:icon="action.icon"
			/>
		</template>
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.TqMultiSelectPopup
	position fixed
	popup-style()
	margin 3px 0
	top 0
	left 0
	z-index 1000
	visibility hidden
	display flex
	padding 4px
	border-color var(--tq-color-accent)
	box-shadow none
	overflow hidden
	hover-transition(width, height, border-radius)

	&:not(:hover)
		width calc(var(--tq-input-height) / 2)
		height calc(var(--tq-input-height) / 2)
		border-radius 99px

	&.visible
		visibility visible

.tune-icon
	position absolute
	inset 2px
	width calc(100% - 4px)
	height calc(100% - 4px)
	background var(--tq-color-background)
	color var(--tq-color-accent)
	opacity 1
	pointer-events none

	input

	.TqMultiSelectPopup:hover &
		opacity 0
</style>
