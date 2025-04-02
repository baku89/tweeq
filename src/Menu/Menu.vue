<script setup lang="ts">
import type {IconSequence} from 'bndr-js'

import {BindIcon} from '../BindIcon'
import {Icon} from '../Icon'
import {computed, ref, useTemplateRef} from 'vue'
import Popover from '../Popover/Popover.vue'
import {useThemeStore} from '../stores/theme'

interface BaseMenu {
	icon?: string
	label: string
	shortLabel?: string
	perform?: () => void
	children?: MenuItem[]
}

export interface MenuCommand extends BaseMenu {
	perform: () => void
	bindIcon?: IconSequence
}

export interface MenuGroup extends BaseMenu {
	children: (MenuGroup | MenuCommand)[]
}

export type MenuItem = MenuCommand | MenuGroup

interface Props {
	items: MenuItem[]
}

const props = defineProps<Props>()

const theme = useThemeStore()

const hoverIndex = ref(-1)

const $lists = useTemplateRef('$lists')

const $childReference = computed(() => {
	if (hoverIndex.value === -1) return null

	return $lists.value?.[hoverIndex.value] ?? null
})

const childItems = computed(() => {
	return props.items[hoverIndex.value].children ?? null
})
</script>

<template>
	<ul class="TqMenu">
		<li
			ref="$lists"
			v-for="(menu, index) in items"
			:key="index + '_item'"
			v-close-popper.all
			class="menu"
			@click="menu.perform?.()"
			@pointerenter="hoverIndex = index"
		>
			<Icon v-if="menu.icon" class="icon" :icon="menu.icon" />
			<span v-else />
			<div class="label-container">
				<span class="label">{{ menu.shortLabel ?? menu.label }}</span>
				<BindIcon
					v-if="'bindIcon' in menu && menu.bindIcon"
					class="bind-icon"
					:icon="menu.bindIcon"
				/>
				<Icon
					v-if="'children' in menu"
					class="group-chevron"
					icon="mdi:chevron-right"
				/>
			</div>
		</li>
	</ul>
	<Popover
		v-if="$childReference && childItems"
		:reference="$childReference"
		placement="right-start"
		:open="true"
		:offset="{crossAxis: -theme.popupPadding}"
		:lightDismiss="false"
	>
		<Menu :items="childItems" />
	</Popover>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqMenu
	display flex
	flex-direction column
	popup-style()
	display grid
	grid-template-columns min-content 1fr

.menu
	grid-column 1 / 3
	display grid
	grid-template-columns subgrid
	padding 2px 6px
	height calc(var(--tq-input-height) + 4px)
	line-height var(--tq-input-height)
	align-items center
	border-radius var(--tq-radius-input)

	&:hover
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)

.icon
	margin-right 8px

.label-container
	display flex
	justify-content center
	align-items center

.label
	flex-grow 1
	margin-right 1em

.bind-icon
	opacity .5

.group-chevron
	margin-right -6px
</style>
