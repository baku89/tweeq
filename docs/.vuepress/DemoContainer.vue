<script setup lang="ts">
import * as Tq from 'tweeq'
import {ref} from 'vue'

defineSlots<{
	default: (props: {isFullscreen: boolean}) => any
}>()

const isFullscreen = ref(false)

function fullScreen() {
	isFullscreen.value = !isFullscreen.value
}
</script>

<template>
	<Tq.Viewport class="DemoContainer" :class="{fullscreen: isFullscreen}">
		<ClientOnly>
			<InputButton
				class="full-screen-button"
				:icon="isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'"
				:label="isFullscreen ? 'Exit Full Screen' : 'Full Screen'"
				subtle
				@click="fullScreen"
			/>
			<slot :isFullscreen="isFullscreen" />
		</ClientOnly>
	</Tq.Viewport>
</template>

<style lang="stylus" scoped>
.DemoContainer
	position relative
	padding 4rem 0 2rem

	&.fullscreen
		position fixed
		display flex
		flex-direction column
		justify-content center
		align-items center
		z-index 1000
		inset 0
		background-color var(--tq-color-background)

.full-screen-button
	position absolute !important
	top 1rem
	right 0rem

	.fullscreen &
		top 2rem
		right 2rem
</style>
