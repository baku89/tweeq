<script setup lang="ts">
import {autoUpdate, useFloating} from '@floating-ui/vue'
import {vec2} from 'linearly'
import {computed, onMounted, toRef, useTemplateRef, watchEffect} from 'vue'

import {Icon} from '../Icon'
import {MultiSelectType, useMultiSelectStore} from '../stores/multiSelect'
import MultiSelectButton from './MultiSelectButton.vue'
import MultiSelectPad from './MultiSelectPad.vue'

const multiSelect = useMultiSelectStore()

const selectedTypes = computed(() =>
	multiSelect.selectedInputs.map(i => i.type)
)

const $root = useTemplateRef('$root')

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
			type: 'pad'
			updator: (delta: vec2) => (values: any[]) => any[]
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
		updator: (px: number) => (values: number[]) =>
			values.map((v, i) => v + px * (multiSelect.selectedInputs[i].speed ?? 1)),
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
		type: 'pad',
		enabled: types => types.length === 2 && types.every(t => t === 'number'),
		updator: (delta: vec2) => (values: number[]) =>
			vec2.add(
				values as unknown as vec2,
				vec2.mul(delta, [
					multiSelect.selectedInputs[0].speed ?? 1,
					-(multiSelect.selectedInputs[1].speed ?? 1),
				])
			) as unknown as number[],
		icon: 'mdi:dots-grid',
	},
	{
		type: 'button',
		enabled: types =>
			types.length === 2 && types[0] !== 'boolean' && types[0] === types[1],
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
			<MultiSelectPad
				v-if="action.type === 'slider' || action.type === 'pad'"
				:type="action.type"
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

<style lang="stylus" scoped>
@import '../common.styl'

reset-viewport('.TqMultiSelectPopup')

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
		width calc(var(--tq-icon-size) + 6px)
		height calc(var(--tq-icon-size) + 6px)
		border-radius 99px

	&.visible
		visibility visible

.tune-icon
	position absolute
	top 2px
	left 2px
	background var(--tq-color-background)
	color var(--tq-color-accent)
	opacity 1
	pointer-events none

	.TqMultiSelectPopup:hover &
		opacity 0
</style>
