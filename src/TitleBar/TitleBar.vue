<script setup lang="ts">
import {computed, useTemplateRef} from 'vue'
import {ref} from 'vue'

import {ColorIcon} from '../ColorIcon'
import {Menu, type MenuItem} from '../Menu'
import {type Action, useActionsStore} from '../stores/actions'
import type {TitleBarProps} from './types'
import {Popover} from '../Popover'

defineProps<TitleBarProps>()

defineSlots<{
	left(): any
	center(): any
	right(): any
}>()

const actions = useActionsStore()

const appIcon = useTemplateRef<any>('appIcon')
const appMenu = useTemplateRef<any>('appMenu')

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
	<div class="TqTitleBar">
		<div class="left">
			<ColorIcon
				ref="appIcon"
				class="app-icon"
				:src="icon"
				:class="{shown: isMenuShown}"
				@click="isMenuShown = !isMenuShown"
			/>
			<Popover
				:reference="appIcon"
				placement="bottom-start"
				v-model:open="isMenuShown"
			>
				<Menu v-if="isMenuShown" ref="appMenu" :items="menus" />
			</Popover>
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
.TqTitleBar
	--titlebar-area-height: env(titlebar-area-height, 38px)

	position fixed
	display grid
	grid-template-columns 1fr min-content 1fr
	left env(titlebar-area-x, 0)
	top env(titlebar-area-y, 0)
	width env(titlebar-area-width, 100%)
	height var(--titlebar-area-height)

	z-index 100
	user-select none
	background linear-gradient(to bottom, var(--tq-color-background), transparent)
	backdrop-filter blur(2px)
	gap var(--tq-input-gap)
	padding calc((var(--titlebar-area-height) - var(--tq-input-height)) / 2) 9px
	-webkit-app-region: drag
	app-region: drag

	@media (display-mode: window-controls-overlay)
		background \
			linear-gradient(to bottom, var(--tq-color-background) 20%, transparent), \
			linear-gradient(to right, var(--tq-color-background) 0, transparent 15%, transparent 85%, var(--tq-color-background) 100%)

.left, .center, .right
	display flex
	gap var(--tq-input-gap)

	& > *
		flex-grow 0

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
	margin-right .2em
	line-height var(--tq-input-height)
</style>
