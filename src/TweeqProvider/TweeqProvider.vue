<script lang="ts" setup>
import {ActionForm, CommandPalette} from '../CommandPalette'
import {MultiSelectPopup} from '../MultiSelectPopup'
import {PaneModalComplex} from '../PaneModalComplex'
import {PaneModalTabs} from '../PaneModalTabs'
import {TooltipRoot} from '../Tooltip'

defineSlots<{default: () => unknown}>()
</script>

<template>
	<slot />
	<MultiSelectPopup />
	<CommandPalette />
	<ActionForm />
	<PaneModalComplex />
	<PaneModalTabs />
	<TooltipRoot />
</template>
