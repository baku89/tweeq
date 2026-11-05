<script setup lang="ts">
import {useEventListener} from '@vueuse/core'
import {search} from 'fast-fuzzy'
import {computed, ref, shallowRef, useTemplateRef, watch} from 'vue'

import {BindIcon} from '../BindIcon'
import {Icon} from '../Icon'
import {
	type ActionItem,
	type ActionItemOptions,
	useActionsStore,
} from '../stores/actions'
import {useAppConfigStore} from '../stores/appConfig'
import {unsignedMod} from '../util'
import {type Candidate, likely, ranked} from './holes'

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

const typesInUse = computed(() => actions.context?.types ?? null)

/** How many suggestions are listed before anything has been searched for. */
const AT_MOST_SUGGESTED = 6

/** Those last used first, and otherwise as they were given. */
const lastUsedFirst = (items: readonly ActionItem[]): ActionItem[] => {
	const when = (item: ActionItem): number => {
		const at = performedActionsHistory.value.indexOf(item.id)
		return at < 0 ? Infinity : at
	}
	return [...items].sort((a, b) => when(a) - when(b) || 0)
}

type Listed = Candidate<ActionItem> & {heading: string | null}

const candidates = computed((): Listed[] => {
	if (!open.value) return []

	const suggested = actions.context?.suggestions?.() ?? null
	const suggestions = (suggested?.items ?? []) as unknown as ActionItem[]

	if (searchWord.value === '') {
		const fitting = ranked(
			likely(
				Object.values(actions.allActions).map(action => ({
					action,
					filled: actions.filled(action),
				})),
				typesInUse.value
			),
			typesInUse.value
		)
		const shown = new Set(fitting.map(({action}) => action.id))
		const recent = performedActionsHistory.value
			.filter(id => !shown.has(id))
			.map(id => actions.allActions[id])
			.filter(action => action !== undefined)
			.filter(actions.canRun)
		const under = (heading: string, list: Candidate<ActionItem>[]): Listed[] =>
			list.map((item, i) => ({...item, heading: i === 0 ? heading : null}))
		const plain = (action: ActionItem) => ({action, filled: actions.filled(action)})
		return [
			...under('For Selection', fitting),
			...under(
				suggested?.heading ?? '',
				lastUsedFirst(suggestions).slice(0, AT_MOST_SUGGESTED).map(plain)
			),
			...under('Recent Actions', recent.map(plain)),
		]
	}

	return ranked(
		search(searchWord.value, [...Object.values(actions.allActions), ...suggestions], {
			keySelector: action => [
				action.label,
				...((action as {keywords?: string[]}).keywords ?? []),
			],
			returnMatchData: true,
		}).map(({item, score}) => ({
			action: item,
			filled: actions.filled(item),
			score,
		})),
		typesInUse.value
	).map(item => ({...item, heading: null}))
})

const tagOf = (action: unknown): string | undefined => (action as {tag?: string}).tag

const filteredActions = computed(() => candidates.value.map(({action}) => action))

// Shallow, as it is told from the others by being the same object, and a suggestion is a plain one.
const selectedAction = shallowRef<null | ActionItemOptions>(null)

watch(filteredActions, () => {
	if (filteredActions.value.length > 0) {
		selectedAction.value = filteredActions.value[0]!
	} else {
		selectedAction.value = null
	}
})

// Whatever has the focus, as what is being typed in would otherwise leave it to the browser to print.
useEventListener(
	window,
	'keydown',
	(e: KeyboardEvent) => {
		if (e.key.toLowerCase() !== 'p' || !(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return
		e.preventDefault()
		e.stopPropagation()
		$popover.value?.togglePopover()
	},
	{capture: true}
)

function onKeydown(e: KeyboardEvent) {
	if (selectedAction.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
		const index = filteredActions.value.indexOf(selectedAction.value as any)
		const length = filteredActions.value.length

		const move = e.key === 'ArrowDown' ? 1 : -1

		const newIndex = unsignedMod(index + move, length)
		selectedAction.value = filteredActions.value[newIndex]!
	}

	if (e.key === 'Enter' && selectedAction.value) {
		// It is this that was entered, and not a modal that this may open, nor what the focus goes back to.
		e.preventDefault()
		e.stopPropagation()
		perform(selectedAction.value as ActionItemOptions)
	}
}

function perform(action: ActionItemOptions) {
	if (!actions.canRun(action as ActionItem)) return

	performedActionsHistory.value = [
		...new Set([action.id, ...performedActionsHistory.value]),
	].slice(0, 10)

	$popover.value?.hidePopover()
	void actions.request(action as ActionItem)
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
		<ul>
			<template v-for="(action, index) in filteredActions" :key="action.id">
				<li v-if="candidates[index]?.heading" class="recentActions">
					{{ candidates[index]?.heading }}
				</li>
				<li
					class="action"
					:class="{
						selected: action === selectedAction,
						unavailable: !actions.canRun(action),
					}"
					@pointermove="selectedAction = action"
					@click="perform(action)"
				>
					<Icon class="action-icon" :icon="action.icon ?? ''" />
					<span class="action-label">{{ actions.labelOf(action) }}</span>
					<span v-if="searchWord !== '' && tagOf(action)" class="action-tag">
						{{ tagOf(action) }}
					</span>
					<BindIcon
						v-if="action.bind?.icon ?? action.hint"
						:icon="(action.bind?.icon ?? action.hint)!"
						class="action-bind-icon"
					/>
				</li>
			</template>
		</ul>
	</div>
</template>

<!--
	The popover is promoted to the top layer and rendered outside .TqViewport,
	so it misses Tweeq's viewport reset (font-family, etc.) and falls back to
	the UA serif font. Apply the reset here, unscoped — same as PaneModal.
-->
<style lang="stylus">
@import '../common.styl'

reset-viewport('.TqCommandPalette')
</style>

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
	box-shadow var(--tq-shadow-popup)

.searchContainer
	display flex
	align-items center
	gap var(--tq-gap-related)
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
	gap var(--tq-gap-section)
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

.action-tag
	opacity .5
	font-size .9em

.action-label
	flex-grow 1

.action-bind-icon
	opacity .5
	font-size 1.1em

.action.unavailable .action-icon,
.action.unavailable .action-label
	opacity .5
</style>
