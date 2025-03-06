<script setup lang="ts">
import {Menu as VMenu} from 'floating-vue'
import {computed} from 'vue'
import {ref} from 'vue'

import {ColorIcon} from '../ColorIcon'
import {Menu, type MenuItem} from '../Menu'
import {type Action, useActionsStore} from '../stores/actions'
import type {TitleBarProps} from './types'

defineProps<TitleBarProps>()

defineSlots<{
	left(): any
	center(): any
	right(): any
}>()

const actions = useActionsStore()

const isMenuShown = ref(false)

function convertToMenuItem(action: Action): MenuItem {
	if ('perform' in action) {
		return {
			...action,
			bindIcon: action.bind?.icon,
		}
	} else {
		return {
			...action,
			children: action.children.map(convertToMenuItem),
		}
	}
}

const menus = computed(() => (actions.menu as Action[]).map(convertToMenuItem))
</script>

<template>
	<div class="TitleBar">
		<div class="left">
			<VMenu
				placement="bottom-start"
				:delay="0"
				:distance="4"
				@update:shown="isMenuShown = $event"
			>
				<ColorIcon class="app-icon" :src="icon" :class="{shown: isMenuShown}" />
				<template #popper>
					<Menu :items="menus" />
				</template>
			</VMenu>
			<span class="app-name">{{ name }}</span>
			<slot name="left" />
		</div>
		<div class="center">
			<slot name="center" />
		</div>
		<div class="right">
			<slot name="right" />
		</div>
	</div>
</template>

<style lang="stylus" scoped>
.TitleBar
	display grid
	grid-template-columns 1fr min-content 1fr
	left env(titlebar-area-x, 0)
	top env(titlebar-area-y, 0)
	width env(titlebar-area-width, 100%)
	height var(--titlebar-area-height)
	z-index 100
	user-select none
	position fixed
	background linear-gradient(to bottom, var(--tq-color-background), transparent)
	backdrop-filter blur(2px)
	gap 9px
	padding calc((var(--titlebar-area-height) - var(--tq-input-height)) / 2) 9px
	-webkit-app-region: drag
	app-region: drag
	line-height var(--tq-input-height)

	@media (display-mode: window-controls-overlay)
		background linear-gradient(to bottom, var(--tq-color-background) 20%, transparent), linear-gradient(to right, var(--tq-color-background) 0, transparent 15%, transparent 85%, var(--tq-color-background) 100%)

.left, .center, .right
	display flex
	gap 9px

	& > :deep(*)
		-webkit-app-region no-drag
		app-region no-drag

.right
	justify-content flex-end

.app-icon
	height var(--tq-input-height)

	&.shown
		color var(--tq-color-accent)

.app-name
	font-family 500
	font-family var(--tq-font-heading)
	font-size calc(var(--titlebar-area-height) * .4)
	margin-right 4px
</style>
