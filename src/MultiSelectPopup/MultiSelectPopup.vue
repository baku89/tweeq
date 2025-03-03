<script setup lang="ts">
import {useFloating} from '@floating-ui/vue'
import {onMounted, shallowRef, toRef} from 'vue'

import {useMultiSelectStore} from '../stores/multiSelect'
import {useDrag} from '../useDrag'

const multiSelect = useMultiSelectStore()

const $root = shallowRef<HTMLElement | null>(null)

onMounted(() => {
	if (!$root.value) return
	multiSelect.setPopupEl($root.value)
})

useDrag($root, {
	lockPointer: true,
	onDrag({delta}) {
		multiSelect.update(x => x + delta[0] / 10)
	},
})

const {floatingStyles} = useFloating(
	toRef(multiSelect, 'focusedElement'),
	$root,
	{placement: 'bottom'}
)
</script>

<template>
	<div
		ref="$root"
		:class="{visible: multiSelect.popupVisible}"
		class="MultiSelectPopup"
		:style="floatingStyles"
	>
		<div class="" />
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.MultiSelectPopup
	position fixed
	popup-style()
	top 0
	left 0
	width 100px
	height var(--tq-input-height)
	z-index 1000
	visibility hidden



	&.visible
		visibility visible
</style>
