<script lang="ts" setup>
import {CommandPalette} from '../CommandPalette'
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
	<PaneModalComplex />
	<PaneModalTabs />
	<TooltipRoot />
</template>
