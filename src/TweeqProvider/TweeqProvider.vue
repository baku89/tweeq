<script lang="ts" setup>
import {CommandPalette} from '../CommandPalette'
import {MultiSelectPopup} from '../MultiSelectPopup'
import {PaneModalComplex} from '../PaneModalComplex'

defineSlots<{default: () => unknown}>()
</script>

<template>
	<slot />
	<MultiSelectPopup />
	<CommandPalette />
	<PaneModalComplex />
</template>
