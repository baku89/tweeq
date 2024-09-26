<script setup lang="ts">
import {Icon} from '@iconify/vue'
import {ref} from 'vue'

interface Props {
	icon: string
}

defineProps<Props>()

const emit = defineEmits<{
	expand: []
	collapse: []
}>()

const open = ref(false)

function expand() {
	open.value = true
	emit('expand')
}

function collapse() {
	open.value = false
	emit('collapse')
}
</script>

<template>
	<div
		class="PaneExpandable"
		:class="{open}"
		@pointerenter="expand"
		@pointerleave="collapse"
		@pointercancel="collapse"
	>
		<Icon class="icon" :icon="icon" />
		<div class="content">
			<div class="wrapper">
				<slot />
			</div>
		</div>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.PaneExpandable
	display flex
	flex-direction column
	gap 9px
	position absolute
	top 9px
	right 9px
	// overflow hidden
	background blue
	popup-style()
	transition all 0.3s ease
	box-shadow 0 0 20px -15px transparent
	background transparent
	border-color transparent
	backdrop-filter blur(0px)
	pointer-events none

	.icon
		position absolute
		top var(--tq-popup-padding)
		right var(--tq-popup-padding)
		pointer-events auto

	.content
		transition all .2s ease
		overflow hidden
		opacity 0
		height 260px
		width 0px
		overflow hidden
		transform-origin top right
		transform scale(0.7)

	.wrapper
		width 260px

	&.open
		popup-style()
		pointer-events auto
		.content
			transform none
			opacity 1
			width 260px
			height auto
</style>
