<script setup lang="ts">
import {useEventListener} from '@vueuse/core'
import Case from 'case'
import {computed, ref} from 'vue'

import {Icon} from '../Icon'
import {InputButton} from '../InputButton'
import {InputComplex, type Scheme} from '../InputComplex'
import {Parameter, ParameterGrid} from '../ParameterGrid'
import {useActionsStore} from '../stores/actions'
import {
	activated,
	entered,
	type Hole,
	isComplete,
	isPick,
	picked,
} from './holes'

/**
 * An action waiting for what it is missing. Everything behind this goes on as it was, as
 * what it is missing may well be something back there to point at.
 */
const actions = useActionsStore()

const form = computed(() => actions.form)
const complete = computed(() => form.value !== null && isComplete(form.value))
const types = computed(() => actions.context?.types ?? null)

const nameOf = ({param}: Hole) => Case.capital(param.name)

function dismiss() {
	actions.form = null
	endPull?.()
}

function fill(at: number, values: readonly unknown[]) {
	if (form.value) actions.form = picked(form.value, at, values, types.value)
}

function labelOf({input, param, value, empty}: Hole): string {
	if (!isPick(input)) return ''
	if (empty) return input.placeholder
	const values = param.many === true ? (value as unknown[]) : [value]
	return values.map(input.label).join(', ')
}

const schemeOf = (hole: Hole) =>
	({
		[hole.param.name]: {...('field' in hole.input ? hole.input.field : {}), label: nameOf(hole)},
	}) as unknown as Scheme<Record<string, unknown>>

// -----------------------------------------------------------------------------
// Pulling a line from a hole to what goes in it
// -----------------------------------------------------------------------------

const pull = ref<{x1: number; y1: number; x2: number; y2: number} | null>(null)
let endPull: (() => void) | null = null

function onHolePress(event: PointerEvent, at: number, {input}: Hole) {
	if (event.button !== 0 || !isPick(input)) return
	event.preventDefault()
	const box = (event.currentTarget as Element).getBoundingClientRect()
	const [x1, y1] = [box.left + box.width / 2, box.top + box.height / 2]
	const [startX, startY] = [event.clientX, event.clientY]
	let pulled = false

	const onMove = (move: PointerEvent) => {
		if (!pulled && Math.hypot(move.clientX - startX, move.clientY - startY) < 4) {
			return
		}
		pulled = true
		pull.value = {x1, y1, x2: move.clientX, y2: move.clientY}
	}
	const onUp = (up: PointerEvent) => {
		endPull?.()
		if (!pulled) {
			if (form.value) actions.form = activated(form.value, at)
			return
		}
		const value = input.at?.(up.clientX, up.clientY) ?? null
		if (value !== null) fill(at, [value])
	}
	endPull = () => {
		window.removeEventListener('pointermove', onMove)
		window.removeEventListener('pointerup', onUp)
		pull.value = null
		endPull = null
	}
	window.addEventListener('pointermove', onMove)
	window.addEventListener('pointerup', onUp)
}

// -----------------------------------------------------------------------------
// Dropping what is being dragged, from wherever it is, on a hole
// -----------------------------------------------------------------------------

const holeUnder = (x: number, y: number): number | null => {
	const hole = document
		.elementFromPoint(x, y)
		?.closest('.TqActionForm [data-hole]')
		?.getAttribute('data-hole')
	return hole == null ? null : Number(hole)
}

/** What a drag from where the pointer went down would bring to each hole. */
let dragged: readonly unknown[] = []
const dropOn = ref<number | null>(null)

useEventListener(
	window,
	'pointerdown',
	(event: PointerEvent) => {
		dragged =
			form.value?.holes.map(({input}) =>
				isPick(input) ? (input.from?.(event.clientX, event.clientY) ?? null) : null
			) ?? []
	},
	{capture: true}
)

useEventListener(window, 'pointermove', (event: PointerEvent) => {
	if (dragged.length === 0 || event.buttons === 0 || pull.value) {
		dropOn.value = null
		return
	}
	const under = holeUnder(event.clientX, event.clientY)
	dropOn.value = under !== null && dragged[under] != null ? under : null
})

useEventListener(
	window,
	'pointerup',
	() => {
		const at = dropOn.value
		if (at !== null) fill(at, [dragged[at]])
		dropOn.value = null
		dragged = []
	},
	{capture: true}
)

// -----------------------------------------------------------------------------

const isTyping = (target: EventTarget | null) => {
	const element = target as HTMLElement | null
	return (
		!!element &&
		(element.tagName === 'INPUT' ||
			element.tagName === 'TEXTAREA' ||
			element.isContentEditable)
	)
}

useEventListener(
	window,
	'keydown',
	(event: KeyboardEvent) => {
		if (form.value === null || event.isComposing) return
		if (event.key === 'Escape') {
			event.stopPropagation()
			if (pull.value) endPull?.()
			else dismiss()
		} else if (event.key === 'Enter' && complete.value && !isTyping(event.target)) {
			event.stopPropagation()
			event.preventDefault()
			actions.submitForm()
		}
	},
	{capture: true}
)
</script>

<template>
	<div v-if="form" class="TqActionForm" data-tq-takes-drag>
		<div class="header">
			<span class="title">{{ form.action.label }}</span>
			<button class="close" type="button" aria-label="Close" @click="dismiss">
				<Icon icon="mdi:close" />
			</button>
		</div>
		<ParameterGrid>
			<template v-for="(hole, at) in form.holes" :key="hole.param.name">
				<Parameter v-if="isPick(hole.input)" :label="nameOf(hole)">
					<button
						class="hole"
						type="button"
						:data-hole="at"
						:class="{
							active: form.active === at,
							empty: hole.empty,
							dropping: dropOn === at,
						}"
						@pointerdown="onHolePress($event, at, hole)"
					>
						{{ labelOf(hole) }}
					</button>
				</Parameter>
				<InputComplex
					v-else
					:scheme="schemeOf(hole)"
					:modelValue="{[hole.param.name]: hole.value}"
					@update:modelValue="
						actions.form = entered(form!, at, $event[hole.param.name])
					"
				/>
			</template>
		</ParameterGrid>
		<div class="footer">
			<InputButton
				label="OK"
				:disabled="!complete"
				@click="actions.submitForm()"
			/>
		</div>
	</div>
	<svg v-if="pull" class="TqActionForm-pull">
		<line :x1="pull.x1" :y1="pull.y1" :x2="pull.x2" :y2="pull.y2" />
	</svg>
</template>

<!--
	This is outside of .TqViewport, so it misses Tweeq's viewport reset, as the
	palette does. It is applied here, unscoped, in the same way.
-->
<style lang="stylus">
@import '../common.styl'

reset-viewport('.TqActionForm')
</style>

<style lang="stylus" scoped>
@import '../common.styl'

.TqActionForm
	position fixed
	z-index 100
	top 56px
	left 50%
	transform translateX(-50%)
	width 300px
	display flex
	flex-direction column
	gap var(--tq-gap-related)
	padding 9px 12px 12px
	border-radius 8px
	background var(--tq-color-surface)
	border 1px solid var(--tq-color-border)
	box-shadow var(--tq-shadow-popup)

.header
	display flex
	align-items center
	justify-content space-between

.title
	font-weight bold

.close
	display flex
	border none
	background none
	color inherit
	padding 0
	cursor pointer
	opacity .6

	&:hover
		opacity 1

.hole
	display block
	width 100%
	height var(--tq-input-height)
	padding 0 6px
	border none
	border-radius var(--tq-radius-input)
	background var(--tq-color-input)
	color inherit
	font inherit
	text-align left
	overflow hidden
	white-space nowrap
	text-overflow ellipsis
	cursor pointer

	&.empty
		opacity .7

	&.active,
	&.dropping
		opacity 1
		outline 1px solid var(--tq-color-accent)
		color var(--tq-color-accent)

	&.dropping
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)

.footer
	display flex
	justify-content flex-end

.TqActionForm-pull
	position fixed
	z-index 101
	inset 0
	width 100%
	height 100%
	pointer-events none

	line
		stroke var(--tq-color-accent)
		stroke-width 1.5
</style>
