<script setup lang="ts">
import {computed, ref, useTemplateRef} from 'vue'

import {IconIndicator} from '../IconIndicator'
import {Menu, type MenuItem} from '../Menu'
import {Popover} from '../Popover'
import type {MultiSelectCommand} from '../stores/multiSelect'
import {vTooltip} from '../Tooltip'

const props = defineProps<{command: MultiSelectCommand}>()

const emit = defineEmits<{
	/** It has been done, or else why it could not be. */
	done: [problem: string | null]
}>()

const $root = useTemplateRef<HTMLElement>('$root')

const open = ref(false)

function run(perform: () => string | void) {
	emit('done', perform() ?? null)
}

const items = computed<MenuItem[]>(() =>
	(props.command.children ?? []).map(({label, perform}) => ({
		label,
		perform: () => run(perform),
	}))
)

function onClick() {
	if (props.command.perform) run(props.command.perform)
	else open.value = !open.value
}
</script>

<template>
	<div ref="$root" class="TqMultiSelectCommandButton">
		<IconIndicator
			v-tooltip="open ? null : command.label"
			:icon="command.icon"
			@click="onClick"
		/>
		<!-- Inside the popup, so that clicking it does not count as clicking away. -->
		<Popover
			v-if="items.length > 0"
			v-model:open="open"
			:reference="$root"
			placement="bottom-start"
		>
			<Menu :items="items" @close="open = false" />
		</Popover>
	</div>
</template>

<style lang="stylus" scoped>
.TqMultiSelectCommandButton
	border-radius var(--tq-radius-input)

	&:hover
		background var(--tq-color-input-hover)
</style>
