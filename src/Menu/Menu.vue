<script setup lang="ts">
import {Icon} from '@iconify/vue'
import {Emitter} from 'bndr-js'
import {ref} from 'vue'

import BindIcon from '../BindIcon'

export interface MenuItem {
	icon?: string
	label: string
	perform: () => void
	bindIcon?: typeof Emitter.icon
}

interface Props {
	items: MenuItem[]
}

const $root = ref<HTMLElement | null>(null)

defineProps<Props>()
</script>

<template>
	<ul ref="$root" class="Menu">
		<li
			v-for="(item, i) in items"
			:key="i"
			class="item"
			@click="item.perform()"
		>
			<Icon class="icon" :icon="item.icon ?? ''" />
			<span class="label">{{ item.label }}</span>
			<BindIcon v-if="item.bindIcon" class="bind-icon" :icon="item.bindIcon" />
		</li>
	</ul>
</template>

<style lang="stylus" scoped>

.Menu
	display flex
	flex-direction column
	padding 4px
	gap 4px

.item
	padding 0 8px
	height var(--tq-input-height)
	line-height var(--tq-input-height)
	display flex
	gap 8px
	align-items center
	align-content center
	// justify-content center
	border-radius var(--tq-input-border-radius)

	&:hover
		background var(--tq-color-primary)
		color var(--tq-color-on-primary)

.label
	flex-grow 1

.bind-icon
	opacity .5
</style>
