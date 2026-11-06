<script setup lang="ts">
import {unrefElement} from '@vueuse/core'
import {vec2} from 'linearly'
import {computed, onMounted, ref, useTemplateRef, watch, watchEffect} from 'vue'

import {rotated} from '../stores/multiEdit'
import {type MultiSelectType, useMultiSelectStore} from '../stores/multiSelect'
import {vTooltip} from '../Tooltip'
import {addAnchorName} from '../util'
import MultiSelectButton from './MultiSelectButton.vue'
import MultiSelectCommandButton from './MultiSelectCommandButton.vue'
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

// Anchor the popup under the focused input via CSS Anchor Positioning (no
// floating-ui). The browser keeps it positioned on scroll/resize. anchor() is
// passed inline rather than in the stylus block, which would try to parse it as
// a stylus function call.
const ANCHOR_NAME = '--tq-multi-select-anchor'

const anchorStyle = {
	positionAnchor: ANCHOR_NAME,
	top: 'anchor(bottom)',
	right: 'anchor(right)',
}

watchEffect(onCleanup => {
	const el = multiSelect.focusedElement
	if (!el) return
	onCleanup(addAnchorName(el, ANCHOR_NAME))
})

type MultiSelectAction = {
	enabled: (types: MultiSelectType[]) => boolean
	icon: string
	label: string
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
			values.map((v, i) => v + px * (multiSelect.selectedInputs[i]!.speed ?? 1)),
		icon: 'material-symbols:add',
		label: 'Offset',
	},
	{
		type: 'slider',
		enabled: types => types.every(t => t === 'number'),
		updator: (px: number) => (values: number[]) =>
			values.map(v => v * (px / 100 + 1)),
		icon: 'mdi:multiply',
		label: 'Scale',
	},
	{
		type: 'pad',
		enabled: types => types.length === 2 && types.every(t => t === 'number'),
		updator: (delta: vec2) => (values: number[]) =>
			vec2.add(
				values as unknown as vec2,
				vec2.mul(delta, [
					multiSelect.selectedInputs[0]!.speed ?? 1,
					-(multiSelect.selectedInputs[1]!.speed ?? 1),
				])
			) as unknown as number[],
		icon: 'mdi:dots-grid',
		label: 'Offset in 2D',
	},
	{
		type: 'button',
		enabled: types =>
			types.length === 2 &&
			types[0] !== 'boolean' &&
			types[0] !== 'opaque' &&
			types[0] === types[1],
		updator: rotated,
		icon: 'material-symbols:swap-vert',
		label: 'Swap',
	},
	{
		type: 'button',
		enabled: types =>
			types.length > 2 &&
			types[0] !== 'boolean' &&
			types[0] !== 'opaque' &&
			types.every(t => t === types[0]),
		updator: rotated,
		icon: 'material-symbols:rotate-right',
		label: 'Rotate',
	},
]

const enabledActions = computed(() =>
	actions.filter(a => a.enabled(selectedTypes.value))
)

// How many are selected is said whenever there are several, with nothing to be done to them
// together or not, for it to be seen what is selected as one and what is not.
const visible = computed(() => multiSelect.selectedInputs.length > 1)

// With nothing to be done to them together, it says so as it opens, rather than opening to
// nothing or not opening at all.
const empty = computed(
	() => enabledActions.value.length === 0 && multiSelect.commands.length === 0
)

// Each time one more joins, the outline of each thickens a little, one after another, in
// the color it already has, and the count goes up: what is selected shows itself as it
// builds up. Nothing changes size but the outline.
const PULSE: Keyframe[] = [
	{boxShadow: '0 0 0 0 var(--tq-color-accent)'},
	{boxShadow: '0 0 0 1.5px var(--tq-color-accent)', offset: 0.3},
	{boxShadow: '0 0 0 0 var(--tq-color-accent)'},
]

// One after another, however many there are, within this much in all, so that many of
// them do not take long to finish.
const PULSE_STAGGER = 30
const PULSE_SPREAD = 100

const BUMP: Keyframe[] = [
	{transform: 'scale(1)'},
	{transform: 'scale(1.3)', offset: 0.35},
	{transform: 'scale(0.94)', offset: 0.7},
	{transform: 'scale(1)'},
]

watch(
	() => multiSelect.selectedInputs.length,
	(count, previous) => {
		if (count <= previous || count < 2) return
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

		const step = Math.min(PULSE_STAGGER, PULSE_SPREAD / (count - 1))
		multiSelect.selectedInputs.forEach((input, i) => {
			unrefElement(input.el)?.animate(PULSE, {
				duration: 340,
				delay: i * step,
				easing: 'ease-out',
			})
		})
		$root.value?.animate(BUMP, {duration: 340, easing: 'ease-out'})
	},
	{flush: 'post'}
)

// Why the last command could not be done, until the selection is something else.
const problem = ref<string | null>(null)
watch(
	() => multiSelect.selectedInputs,
	() => {
		problem.value = null
	}
)

watchEffect(() => {
	$root.value?.togglePopover(visible.value)
})
</script>

<template>
	<div
		ref="$root"
		:class="{visible}"
		class="TqMultiSelectPopup"
		:style="anchorStyle"
		popover="manual"
	>
		<div class="count">
			<Transition name="count-roll">
				<span :key="multiSelect.selectedInputs.length">
					{{ multiSelect.selectedInputs.length }}
				</span>
			</Transition>
		</div>
		<div class="actions">
			<template v-for="action in enabledActions" :key="action.icon">
				<MultiSelectPad
					v-if="action.type === 'slider' || action.type === 'pad'"
					v-tooltip="action.label"
					:type="action.type"
					:updator="action.updator"
					:icon="action.icon"
				/>
				<MultiSelectButton
					v-else-if="action.type === 'button'"
					v-tooltip="action.label"
					:updator="action.updator"
					:icon="action.icon"
				/>
			</template>
			<MultiSelectCommandButton
				v-for="command in multiSelect.commands"
				:key="command.label"
				:command="command"
				@done="problem = $event"
			/>
			<p v-if="empty" class="none">Nothing to do with these together</p>
		</div>
		<p v-if="problem !== null" class="problem">{{ problem }}</p>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

reset-viewport('.TqMultiSelectPopup')

.TqMultiSelectPopup
	position fixed
	inset auto
	popup-style()
	// On the corner of the input it belongs to, and not moving from there as it opens,
	// so that it does not slip away from the pointer that opened it.
	margin -6px -4px 0 0
	z-index 1000
	visibility hidden
	padding 0
	border-color var(--tq-color-accent)
	box-shadow none
	overflow hidden
	hover-transition(width, height, border-radius)
	box-sizing border-box

	// How many are being edited as one, until it is reached for. A menu it has opened
	// keeps it open, while the pointer goes over to the menu.
	// Never smaller than the pill it opens from, for the pointer on it to stay on it.
	min-width 22px
	min-height 18px

	&:not(:hover):not(:has(:popover-open))
		width 22px
		height 18px
		border-radius 99px
		background var(--tq-color-accent)
		backdrop-filter none

		.count
			opacity 1

	&.visible
		visibility visible

.count
	position absolute
	inset 0
	font-size 11px
	font-weight 600
	font-variant-numeric tabular-nums
	color var(--tq-color-on-accent)
	opacity 0
	pointer-events none

	span
		position absolute
		inset 0
		display grid
		place-items center

.count-roll-enter-active,
.count-roll-leave-active
	transition transform 220ms cubic-bezier(0.3, 1.4, 0.5, 1)

.count-roll-enter-from
	transform translateY(100%)

.count-roll-leave-to
	transform translateY(-100%)

.actions
	display flex
	flex-direction row
	padding 2px
	gap var(--tq-gap-group)
	opacity 0

	.TqMultiSelectPopup:hover &,
	.TqMultiSelectPopup:has(:popover-open) &
		opacity 1

.none
	margin 0
	padding 0 6px
	line-height 22px
	white-space nowrap
	color var(--tq-color-text-mute)

.problem
	display none
	max-width 240px
	padding 0 6px 4px
	color var(--tq-color-error)

	.TqMultiSelectPopup:hover &,
	.TqMultiSelectPopup:has(:popover-open) &
		display block
</style>
