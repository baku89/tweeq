<script lang="ts" setup>
interface Props {
	icon?: string
	label: string
}

defineProps<Props>()
</script>

<template>
	<button class="InputButton">
		<span v-if="icon" class="icon material-symbols-outlined"> {{ icon }} </span>
		<span class="label">{{ label }}</span>
	</button>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputButton
	padding 0 1em
	height var(--tq-input-height)
	border-radius var(--tq-input-border-radius)
	background var(--tq-color-primary-container)
	color var(--tq-color-on-primary-container)
	hover-transition(background, color)
	display flex
	align-items center
	gap 4px

	&:focus-visible
		background var(--tq-color-tinted-input-active)

	&:hover
		color var(--tq-color-on-primary)
		background var(--tq-color-primary)

.label
	height 16px
</style>
