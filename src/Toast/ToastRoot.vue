<script lang="ts" setup>
import {onBeforeUnmount, watch} from 'vue'

import {Icon} from '../Icon'
import {InputButton} from '../InputButton'
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
			<InputButton
				v-for="action in toast.actions ?? []"
				:key="action.label"
				class="action"
				:label="action.label"
				:tooltip="action.tooltip"
				subtle
				@click="perform(toast, action.perform)"
			/>
			<InputButton
				class="close"
				icon="mdi:close"
				aria-label="Dismiss"
				ghost
				@click="store.dismiss(toast.id)"
			/>
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

.toast
	popup-style()
	pointer-events auto
	display flex
	align-items center
	gap var(--tq-gap-related, 4px)
	max-width 100%
	padding var(--tq-popup-padding)
	padding-left calc(var(--tq-popup-padding) * 2)

.icon
	flex none

.warning .icon
	color var(--tq-color-warning)

.message
	min-width 0
	padding-right .5em

.action, .close
	flex none

.toast-enter-active, .toast-leave-active
	transition opacity var(--tq-hover-transition-duration) ease, transform var(--tq-hover-transition-duration) ease

.toast-enter-from, .toast-leave-to
	opacity 0
	transform translateY(-4px)
</style>
