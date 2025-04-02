<script setup lang="ts">
import {useEventListener} from '@vueuse/core'
import * as Bndr from 'bndr-js'
import {search} from 'fast-fuzzy'
import {computed, ref, useTemplateRef, watch} from 'vue'

import {BindIcon} from '../BindIcon'
import {Icon} from '../Icon'
import {type ActionItemOptions, useActionsStore} from '../stores/actions'
import {useAppConfigStore} from '../stores/appConfig'
import {useBndr} from '../use/useBndr'
import {unsignedMod} from '../util'

const actions = useActionsStore()

const $popover = useTemplateRef('$popover')
const searchWord = ref('')

const appConfig = useAppConfigStore()

const performedActionsHistory = appConfig.ref<string[]>(
	'commandPalette.performedActionsHistory',
	[]
)

const open = ref(false)

useEventListener($popover, 'toggle', (e: ToggleEvent) => {
	open.value = e.newState === 'open'
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
		return performedActionsHistory.value
			.map(id => actions.allActions[id])
			.filter(action => action !== undefined)
	}

	return search(searchWord.value, Object.values(actions.allActions), {
		keySelector: action => action.label,
	})
})

const selectedAction = ref<null | ActionItemOptions>(null)

watch(filteredActions, () => {
	if (filteredActions.value.length > 0) {
		selectedAction.value = filteredActions.value[0]
	} else {
		selectedAction.value = null
	}
})

useBndr($popover, $popover => {
	Bndr.keyboard()
		.hotkey('command+p', {preventDefault: true, capture: true})
		.on(() => $popover instanceof HTMLElement && $popover.togglePopover())
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
		perform(selectedAction.value as ActionItemOptions)
	}
}

function perform(action: ActionItemOptions) {
	performedActionsHistory.value = [
		...new Set([action.id, ...performedActionsHistory.value]),
	].slice(0, 10)

	$popover.value?.hidePopover()
	action.perform()
}
</script>

<template>
	<div ref="$popover" class="TqCommandPalette" popover>
		<div class="searchContainer">
			<Icon class="search-icon" icon="material-symbols:search-rounded" />
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
				@pointermove="selectedAction = action"
				@click="perform(action)"
			>
				<Icon class="action-icon" :icon="action.icon ?? ''" />
				<span class="action-label">{{ action.label }}</span>
				<BindIcon
					v-if="action.bind?.icon"
					:icon="action.bind.icon"
					class="action-bind-icon"
				/>
			</li>
		</ul>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqCommandPalette
	width 400px
	top 20vh
	margin 0 auto
	border-radius 8px
	background var(--tq-color-surface)
	border 1px solid var(--tq-color-border)
	backdrop-filter blur(4px)
	padding 0 9px
	box-shadow 0 0 30px 0 var(--tq-color-shadow)

.searchContainer
	display flex
	align-items center
	gap 6px
	padding-left 3px

.search-icon
	display block

.search
	display block
	flex-grow 1
	font-size calc(1.2 * var(--tq-rem))
	height 48px
	line-height 36px

	&::placeholder
		font-size calc(1.2 * var(--tq-rem))
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
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)

.action-icon
	width 20px

.action-label
	flex-grow 1

.action-bind-icon
	opacity .5
	font-size 1.1em
</style>
