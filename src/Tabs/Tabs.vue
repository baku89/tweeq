<script setup lang="ts">
import {onMounted, provide, reactive} from 'vue'

import {useAppConfigStore} from '../stores/appConfig'
import {AddTabKey, DeleteTabKey, TabsProviderKey, UpdateTabKey} from './symbols'
import type {Tab, TabsProps, TabsState} from './types'

const props = defineProps<TabsProps>()

const emit = defineEmits<{
	changed: [tab: Tab]
	clicked: [tab: Tab]
}>()

const state: TabsState = reactive({
	activeId: '',
	lastActiveId: '',
	tabs: [] as Tab[],
})

provide(TabsProviderKey, state)

provide(AddTabKey, tab => {
	state.tabs.push(tab)
})

provide(UpdateTabKey, (id: string, data: Tab) => {
	const tabIndex = state.tabs.findIndex(tab => tab.id === id)

	data.isActive = state.tabs[tabIndex].isActive

	state.tabs[tabIndex] = data
})

provide(DeleteTabKey, id => {
	const tabIndex = state.tabs.findIndex(tab => tab.id === id)

	state.tabs.splice(tabIndex, 1)
})

const appConfig = useAppConfigStore()
const activeId = appConfig.ref<null | string>(`${props.name}.active`, null)

const selectTab = (id: string, event?: Event): void => {
	const selectedTab = findTab(id)

	if (!selectedTab) {
		return
	}

	if (event && selectedTab.isDisabled) {
		event.preventDefault()
		return
	}

	if (state.lastActiveId === selectedTab.id) {
		emit('clicked', selectedTab)
		return
	}

	state.tabs.forEach(tab => {
		tab.isActive = tab.id === selectedTab.id
	})

	emit('changed', selectedTab)

	state.lastActiveId = state.activeId = selectedTab.id

	activeId.value = selectedTab.id
}

const findTab = (id: string): Tab | undefined => {
	return state.tabs.find(tab => tab.id === id)
}

onMounted(() => {
	if (!state.tabs.length) {
		return
	}

	if (activeId.value !== null && findTab(activeId.value)) {
		selectTab(activeId.value)
		return
	}

	if (props.options?.defaultTabId && findTab(props.options.defaultTabId)) {
		selectTab(props.options.defaultTabId)
		return
	}

	selectTab(state.tabs[0].id)
})
</script>

<template>
	<div class="TqTabs" :class="{vertical}">
		<div class="tablist-wrapper">
			<div v-if="$slots['before-tablist']" class="before-tablist">
				<slot name="before-tablist" />
			</div>
			<ul role="tablist" class="tablist">
				<li
					v-for="(tab, i) in state.tabs"
					:key="i"
					class="tablist-item"
					:class="{disabled: tab.isDisabled, active: tab.isActive}"
					role="presentation"
				>
					<a
						class="tablist-link"
						:class="{disabled: tab.isDisabled, active: tab.isActive}"
						role="tab"
						:aria-controls="tab.paneId"
						:aria-selected="tab.isActive"
						tabindex="0"
						@click="selectTab(tab.id, $event)"
						>{{ tab.name }}</a
					>
				</li>
			</ul>
		</div>
		<div class="panels-wrapper">
			<slot />
		</div>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqTabs
	display grid
	gap calc(0.5 * var(--tq-rem))
	grid-template-columns 1fr
	grid-template-rows min-content 1fr

.tablist-wrapper
	display flex
	gap var(--tq-rem)

.tablist
	display flex
	gap calc(0.2 * var(--tq-rem))
	list-style-type none
	user-select none

.tablist-item
	line-height calc(2 * var(--tq-rem))
	padding 2px calc(0.4 * var(--tq-rem)) 0
	font-weight bold
	border-bottom 3px solid transparent
	hover-transition(border-bottom-color)

	&.active
		border-bottom-color var(--tq-color-text)

		&:hover
			border-bottom-color var(--tq-color-accent)

.tablist-link
	text-decoration none
	color var(--tq-color-text)
	opacity .4
	// Transition colour too: with only opacity animated, un-hovering snaps the
	// colour back to text (white) while opacity is still high — a white flash
	// before it dims.
	hover-transition(opacity, color)

	&:hover
		color var(--tq-color-accent)
		opacity 1

	&.active
		opacity 1

.panels-wrapper
	position relative
	// Stack every panel in a single cell so the wrapper is as tall as the tallest
	// tab and the height stays put when switching (Tab.vue hides the inactive ones).
	display grid

	:deep(.TqTab)
		grid-column 1
		grid-row 1

// Vertical (left tab list, panels on the right) — AE/Resolve-style.
.TqTabs.vertical
	grid-template-columns min-content 1fr
	grid-template-rows 1fr
	gap var(--tq-rem)
	min-height 0

	.tablist
		flex-direction column
		gap 2px

	.tablist-item
		border-bottom 0
		border-left 3px solid transparent
		padding calc(0.2 * var(--tq-rem)) calc(0.6 * var(--tq-rem))
		white-space nowrap

		&.active
			border-left-color var(--tq-color-text)

			&:hover
				border-left-color var(--tq-color-accent)

	// Divider between the tab list (left) and the panels (right).
	.panels-wrapper
		min-height 0
		overflow-y auto
		border-left 1px solid var(--tq-color-border)
		padding-left var(--tq-rem)
</style>
../stores/useAppStorage
