<script lang="ts" setup>
interface Props {
	modelValue: boolean
	icon: string
}

defineProps<Props>()

defineEmits<{
	'update:modelValue': [boolean]
}>()
</script>

<template>
	<button
		class="InputIconToggle"
		:class="{checked: modelValue}"
		@click="$emit('update:modelValue', !modelValue)"
	>
		<span class="icon material-symbols-outlined"> {{ icon }} </span>
	</button>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputIconToggle
	width var(--tq-input-height)
	height var(--tq-input-height)
	border-radius var(--tq-input-border-radius)
	background var(--tq-color-input)
	color var(--tq-color-on-primary-container)

	&:hover
		background var(--tq-color-input-hover)

	&.checked
		background var(--tq-color-primary)
		color var(--tq-color-on-primary)


.icon
	display block
	text-align center
	width var(--tq-input-height)
	height var(--tq-input-height)
	font-size 20px
	line-height var(--tq-input-height)
</style>
