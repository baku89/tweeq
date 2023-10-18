<script setup lang="ts">
import {Icon} from '@iconify/vue'
import {useEventListener} from '@vueuse/core'
import {Bndr} from 'bndr-js'
import {search} from 'fast-fuzzy'
import {computed, ref, watch} from 'vue'

import {useBndr} from '..'
import {type Action, useActionsStore} from '../stores/actions'
import {useAppConfigStore} from '../stores/appConfig'
import {unsignedMod} from '../util'

const actions = useActionsStore()

const $popover = ref<HTMLElement | null>(null)
const searchWord = ref('')

const appConfig = useAppConfigStore()

const performedActions = appConfig.ref<string[]>(
	'commandPalette.performedActions',
	[]
)

const open = ref(false)

useEventListener($popover, 'toggle', e => {
	open.value = (e as ToggleEvent).newState === 'open'
})

watch(
	open,
	open => {
		searchWord.value = ''
		if (open) {
			$popover.value?.querySelector('input')?.focus()
		}
	},
	{immediate: true}
)

const filteredActions = computed(() => {
	if (searchWord.value === '' && open.value) {
		return performedActions.value
			.map(id => actions.allActions[id])
			.filter(action => action !== undefined)
	}

	return search(searchWord.value, Object.values(actions.allActions), {
		keySelector: action => action.label,
	})
})

const selectedAction = ref<null | Action>(null)

watch(filteredActions, () => {
	if (filteredActions.value.length > 0) {
		selectedAction.value = filteredActions.value[0]
	} else {
		selectedAction.value = null
	}
})

useBndr($popover, $popover => {
	Bndr.keyboard()
		.key('command+p', {preventDefault: true, capture: true})
		.on(() => $popover.togglePopover())
})

function onKeydown(e: KeyboardEvent) {
	if (e.key === 'p' && e.metaKey) {
		e.preventDefault()
		$popover.value?.hidePopover()
	}

	if (selectedAction.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
		const index = filteredActions.value.indexOf(selectedAction.value as any)
		const length = filteredActions.value.length

		const move = e.key === 'ArrowDown' ? 1 : -1

		const newIndex = unsignedMod(index + move, length)
		selectedAction.value = filteredActions.value[newIndex]
	}

	if (e.key === 'Enter' && selectedAction.value) {
		perform(selectedAction.value)
	}
}

function perform(action: Action) {
	performedActions.value = [
		...new Set([action.id, ...performedActions.value]),
	].slice(0, 10)

	$popover.value?.hidePopover()
	action.perform()
}
</script>

<template>
	<div ref="$popover" class="CommandPalette" popover>
		<div class="searchContainer">
			<Icon class="searchIcon" icon="material-symbols:search-rounded" />
			<input
				v-model="searchWord"
				class="search"
				type="text"
				placeholder="Search menus and commands"
				@keydown="onKeydown"
			/>
		</div>
		<div
			v-if="searchWord === '' && filteredActions.length > 0"
			class="recentActions"
		>
			Recent Actions
		</div>
		<ul>
			<li
				v-for="action in filteredActions"
				:key="action.id"
				class="action"
				:class="{selected: action === selectedAction}"
				@pointerenter="selectedAction = action"
				@click="perform(action)"
			>
				<Icon class="action-icon" :icon="action.icon ?? ''" />
				{{ action.label }}
			</li>
		</ul>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.CommandPalette
	width 400px
	background red
	top 20vh
	margin 0 auto
	border-radius 8px
	color var(--tq-color-inverse-on-surface)
	background var(--tq-color-inverse-surface)
	backdrop-filter blur(4px)
	padding 0 9px
	box-shadow 0 0 30px -15px var(--tq-color-shadow)

.searchContainer
	display flex
	align-items center
	gap 6px
	padding-left 3px

.searchIcon
	display block

.search
	display block
	flex-grow 1
	font-size 1.2rem
	height 48px
	line-height 36px

	&::placeholder
		font-size 1.2rem
		color var(--tq-color-inverse-on-surface)
		opacity .3

.recentActions
	padding 0 6px 9px
	font-weight bold
	opacity .8

.action
	display flex
	align-items center
	gap 18px
	line-height 32px
	border-radius 3px
	padding 0 6px

	&:last-child
		margin-bottom 9px

	&.selected
		background var(--tq-color-inverse-primary)
		color var(--tq-color-inverse-surface)

.action-icon
	width 20px
</style>
../useAction ../stores/useAppStorage ../stores/useActions
