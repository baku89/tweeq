<script setup lang="ts">
import {computed, provide, shallowReactive} from 'vue'

import {Icon} from '../Icon'
import {useAppConfigStore} from '../stores/appConfig'
import {vTooltip} from '../Tooltip'
import {type PaneTabProps, PaneTabsKey, type PaneTabsProps} from './types'

const props = defineProps<PaneTabsProps>()

defineSlots<{default: () => any}>()

const appConfig = useAppConfigStore()
const stored = appConfig.ref<string | null>(`${props.name}.active`, null)

// The tabs' own (reactive) props, in mount order — which is template order.
const tabs = shallowReactive<PaneTabProps[]>([])

// Derived rather than set: the stored tab if it (still) exists, else the
// default, else the first. A tab that disappears just falls through.
const activeId = computed(() => {
	const exists = (id?: string | null) => !!id && tabs.some(t => t.id === id)
	if (exists(stored.value)) return stored.value
	if (exists(props.defaultTab)) return props.defaultTab!
	return tabs[0]?.id ?? null
})

provide(PaneTabsKey, {
	activeId,
	add: tab => tabs.push(tab),
	remove(tab) {
		const index = tabs.indexOf(tab)
		if (index >= 0) tabs.splice(index, 1)
	},
})
</script>

<template>
	<div class="TqPaneTabs">
		<ul class="tablist" role="tablist" aria-orientation="vertical">
			<li v-for="tab in tabs" :key="tab.id" role="presentation">
				<button
					v-tooltip="{content: tab.label, placement: 'right'}"
					class="tab"
					:class="{active: tab.id === activeId}"
					type="button"
					role="tab"
					:aria-label="tab.label"
					:aria-selected="tab.id === activeId"
					@click="stored = tab.id"
				>
					<Icon class="icon" :icon="tab.icon" />
				</button>
			</li>
		</ul>
		<div class="panels">
			<slot />
		</div>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

// Two columns, Blender's Properties editor: a strip of icon tabs as wide as
// one icon and its padding, and the active tab's panel beside it.
.TqPaneTabs
	display grid
	grid-template-columns min-content minmax(0, 1fr)
	width 100%
	height 100%

// The strip is a well, a shade off the pane. The active tab takes the pane's
// colour and reaches the strip's right edge, so it runs into its panel.
.tablist
	display flex
	flex-direction column
	gap var(--tq-gap-group)
	padding var(--tq-gap-related) 0 var(--tq-gap-related) var(--tq-gap-related)
	background var(--tq-color-input)
	// More tabs than the pane is tall: the strip scrolls, without a scrollbar
	// eating into its one-icon width.
	overflow-y auto
	scrollbar-width none

.tab
	display grid
	place-items center
	width var(--tq-input-height)
	height var(--tq-input-height)
	border-radius var(--tq-radius-input) 0 0 var(--tq-radius-input)
	color var(--tq-color-text-mute)
	cursor pointer
	hover-transition(color, background)

	&:hover
		color var(--tq-color-text)
		background var(--tq-color-input-hover)

	&:focus-visible
		box-shadow inset 0 0 0 1px var(--tq-color-accent)

	&.active
		color var(--tq-color-text)
		background var(--tq-color-background)

.icon
	width var(--tq-icon-size)
	height var(--tq-icon-size)

.panels
	min-width 0
	min-height 0
</style>
