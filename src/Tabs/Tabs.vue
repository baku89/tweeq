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
	<div class="TqTabs">
		<div class="tablist-wrapper">
			<div clas="before-tablist">
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
	font-size 14px
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
	hover-transition(opacity)

	&:hover
		color var(--tq-color-accent)
		opacity 1

	&.active
		opacity 1

.panels-wrapper
	position relative
</style>
../stores/useAppStorage
