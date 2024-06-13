<script setup lang="ts">
import {Icon} from '@iconify/vue'
interface Props {
	label: string
	longestLabel?: string
	icon?: string
}

defineProps<Props>()
</script>

<template>
	<button class="RoundButton">
		<Icon v-if="icon" :icon="icon" />
		<span :class="{'has-longest-label': longestLabel}">
			<span class="label"> {{ label }} </span>
			<span v-if="longestLabel" class="longest-label">
				{{ longestLabel }}
			</span>
		</span>
	</button>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.RoundButton
	height 32px
	font-size 14px
	border-radius 9999px
	vertical-align middle
	display flex
	justify-content center
	align-items center
	gap .4em
	width auto
	padding 0 12px 0 6px
	background var(--tq-color-accent-container)
	color var(--tq-color-on-accent-container)
	hover-transition(background, color)
	line-height 32px

	&:hover
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)

.has-longest-label
	display inline-block

	& > .label
		position absolute

	& > .longest-label
		visibility hidden
</style>
