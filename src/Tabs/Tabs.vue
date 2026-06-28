<script setup lang="ts">
import {provide, reactive, watch} from 'vue'

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

// Keep exactly one valid tab active. Reactive (not a one-shot onMounted) because
// tabs register via their own onBeforeMount — which, for tabs rendered by a
// v-for, can land after this parent mounts — and the active tab can later be
// removed. A one-shot check that ran before any tab existed would leave nothing
// selected. Preference: the persisted tab, then an explicit default, then tab 0.
function ensureActiveTab() {
	if (!state.tabs.length) return
	// A valid tab is already active → leave it.
	if (state.activeId && findTab(state.activeId)) return

	const next =
		(activeId.value && findTab(activeId.value) && activeId.value) ||
		(props.options?.defaultTabId &&
			findTab(props.options.defaultTabId) &&
			props.options.defaultTabId) ||
		state.tabs[0].id

	selectTab(next)
}

watch(() => state.tabs.map(tab => tab.id), ensureActiveTab, {immediate: true})
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
		// No padding here — it lives on the link below so the whole row (full
		// column width × tab height), not just the label text, is the hover /
		// click target. The flex column already stretches each item to the column
		// width.
		padding 0
		white-space nowrap
		// Transition the LEFT border (the base only transitions border-bottom-color,
		// used by the horizontal layout), so it fades in step with the label colour.
		hover-transition(border-left-color)

		&.active
			border-left-color var(--tq-color-text)

			// Hovering anywhere on the active item (incl. the border sliver outside
			// the link) accents the border — so accent the label in lockstep.
			&:hover
				border-left-color var(--tq-color-accent)

				.tablist-link
					color var(--tq-color-accent)

	// Fill the whole item so the entire row is clickable / hoverable.
	.tablist-link
		display block
		padding calc(0.2 * var(--tq-rem)) calc(0.6 * var(--tq-rem))

	// Divider between the tab list (left) and the panels (right).
	.panels-wrapper
		min-height 0
		overflow-y auto
		border-left 1px solid var(--tq-color-border)
		padding-left var(--tq-rem)
</style>
../stores/useAppStorage
