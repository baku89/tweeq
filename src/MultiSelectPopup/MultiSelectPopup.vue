<script setup lang="ts">
import {onMounted, shallowRef} from 'vue'

import {useMultiSelectStore} from '../stores/multiSelect'

const multiSelect = useMultiSelectStore()

const $root = shallowRef<HTMLElement | null>(null)

onMounted(() => {
	if (!$root.value) return

	multiSelect.setPopupEl($root.value)
})
</script>

<template>
	<div
		ref="$root"
		:class="{visible: multiSelect.popupVisible}"
		class="MultiSelectPopup"
		@click="multiSelect.update(x => x + 1)"
	/>
</template>

<style lang="stylus">
.MultiSelectPopup
	position fixed
	top 0
	left 0
	width 100px
	height 100px
	background red
	z-index 1000
	visibility hidden

	&.visible
		visibility visible
</style>
