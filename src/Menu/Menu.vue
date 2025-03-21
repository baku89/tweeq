<script setup lang="ts">
import type {IconSequence} from 'bndr-js'
import {Menu as VMenu} from 'floating-vue'

import {BindIcon} from '../BindIcon'
import {Icon} from '../Icon'

export interface MenuCommand {
	icon?: string
	label: string
	shortLabel?: string
	perform: () => void
	bindIcon?: IconSequence
}

export interface MenuGroup {
	icon?: string
	label: string
	children: (MenuGroup | MenuCommand)[]
}

export type MenuItem = MenuCommand | MenuGroup

interface Props {
	items: MenuItem[]
}

function perform(menu: MenuItem) {
	if ('perform' in menu) {
		menu.perform()
	}
}

defineProps<Props>()
</script>

<template>
	<ul class="Menu">
		<template v-for="(menu, index) in items">
			<li
				v-if="'perform' in menu"
				:key="index + '_item'"
				v-close-popper.all
				class="menu"
				@click="perform(menu)"
			>
				<Icon class="icon" :icon="menu.icon ?? ''" />
				<span class="label">{{ menu.shortLabel ?? menu.label }}</span>
				<BindIcon
					v-if="'bindIcon' in menu && menu.bindIcon"
					class="bind-icon"
					:icon="menu.bindIcon"
				/>
			</li>
			<VMenu
				v-else
				:key="index + '_group'"
				placement="right-start"
				:delay="0"
				:distance="6"
				:instantMove="true"
			>
				<li class="menu">
					<Icon class="icon" :icon="menu.icon ?? ''" />
					<span class="label">{{ menu.label }}</span>
					<Icon
						v-if="'children' in menu"
						class="group-chevron"
						icon="mdi:chevron-right"
					/>
				</li>
				<template #popper>
					<Menu :items="menu.children" />
				</template>
			</VMenu>
		</template>
	</ul>
</template>

<style lang="stylus" scoped>

.Menu
	display flex
	flex-direction column
	padding 6px

.menu
	padding 0 6px
	height var(--tq-input-height)
	line-height var(--tq-input-height)
	display flex
	gap 8px
	align-items center
	align-content center
	// justify-content center
	border-radius var(--tq-input-border-radius)

	&:hover
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)

.icon
	width calc(var(--tq-input-height) - 4px)

.label
	flex-grow 1
	margin-right 1em

.bind-icon
	opacity .5

.group-chevron
	margin-right -6px
</style>
