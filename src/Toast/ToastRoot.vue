<script lang="ts" setup>
import {onBeforeUnmount, watch} from 'vue'

import {Icon} from '../Icon'
import {vTooltip} from '../Tooltip'
import {type Toast, TOAST_DURATION, useToastStore} from './toast'

const store = useToastStore()

// Each goes by itself after a while, unless the pointer is over it, when it waits.
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function wait(toast: Toast) {
	clearTimeout(timers.get(toast.id))
	const duration = toast.duration ?? TOAST_DURATION
	if (duration <= 0) return
	timers.set(
		toast.id,
		setTimeout(() => store.dismiss(toast.id), duration)
	)
}

function hold(toast: Toast) {
	clearTimeout(timers.get(toast.id))
	timers.delete(toast.id)
}

watch(
	() => store.toasts,
	(toasts, was = []) => {
		for (const toast of toasts) if (!was.includes(toast)) wait(toast)
		for (const toast of was) if (!toasts.includes(toast)) hold(toast)
	},
	{immediate: true}
)

onBeforeUnmount(() => timers.forEach(clearTimeout))

function perform(toast: Toast, action: () => void) {
	store.dismiss(toast.id)
	action()
}
</script>

<template>
	<TransitionGroup tag="div" name="toast" class="TqToastRoot">
		<div
			v-for="toast in store.toasts"
			:key="toast.id"
			class="toast"
			:class="toast.tone ?? 'info'"
			role="status"
			@pointerenter="hold(toast)"
			@pointerleave="wait(toast)"
		>
			<Icon v-if="toast.icon" class="icon" :icon="toast.icon" />
			<span class="message">{{ toast.message }}</span>
			<button
				v-for="action in toast.actions ?? []"
				:key="action.label"
				v-tooltip="action.tooltip"
				class="action"
				type="button"
				@click="perform(toast, action.perform)"
			>
				{{ action.label }}
			</button>
			<button
				class="close"
				type="button"
				aria-label="Dismiss"
				@click="store.dismiss(toast.id)"
			>
				<Icon icon="mdi:close" />
			</button>
		</div>
	</TransitionGroup>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

// Outside the viewport, as a modal is, so it has the same fonts and resets of its own.
reset-viewport('.TqToastRoot')

.TqToastRoot
	position fixed
	top calc(env(titlebar-area-height, 38px) + 12px)
	left 50%
	transform translateX(-50%)
	z-index 2000
	display flex
	flex-direction column
	align-items center
	gap var(--tq-gap-related, 4px)
	max-width calc(100vw - 32px)
	pointer-events none

// A pill, as a tooltip is, being as light a thing as one.
.toast
	pointer-events auto
	display flex
	align-items center
	gap .5em
	max-width 100%
	padding 3px 3px 3px 12px
	border-radius 9999px
	border 1px solid var(--tq-color-border)
	background var(--tq-color-surface)
	color var(--tq-color-text)
	backdrop-filter blur(var(--tq-popup-blur))
	box-shadow var(--tq-shadow-popup)

.icon
	flex none

.warning .icon
	color var(--tq-color-warning)

.message
	min-width 0
	padding-right .25em

.action
	flex none
	height var(--tq-input-height)
	padding 0 .75em
	border-radius 9999px
	background var(--tq-color-input)
	hover-transition(background)

	&:hover
		background var(--tq-color-input-hover)

.close
	flex none
	display grid
	place-items center
	width var(--tq-input-height)
	height var(--tq-input-height)
	border-radius 9999px
	color var(--tq-color-text-mute)
	hover-transition(background, color)

	&:hover
		background var(--tq-color-input-hover)
		color var(--tq-color-text)

.toast-enter-active, .toast-leave-active
	transition opacity var(--tq-hover-transition-duration) ease, transform var(--tq-hover-transition-duration) ease

.toast-enter-from, .toast-leave-to
	opacity 0
	transform translateY(-4px)
</style>
