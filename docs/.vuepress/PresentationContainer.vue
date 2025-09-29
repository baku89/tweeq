<script setup lang="ts" generic="T extends Record<string, any>">
import {InputComplex, Viewport} from 'tweeq'
import {shallowRef} from 'vue'

interface Props {
	title: string
	initialValue: T
	scheme: any
}

const props = defineProps<Props>()

defineSlots<{
	default(props: {modelValue: T}): any
}>()

const modelValue = shallowRef(props.initialValue)

function update(value: T) {
	modelValue.value = value
}
</script>

<template>
	<Viewport class="PresentationContainer">
		<ClientOnly>
			<div class="sandbox">
				<div class="preview">
					<slot :modelValue="modelValue" />
				</div>
				<div class="parameters">
					<InputComplex
						:modelValue="modelValue"
						:scheme="scheme"
						@update:modelValue="update"
					/>
				</div>
			</div>
		</ClientOnly>
	</Viewport>
</template>

<style lang="stylus" scoped>
.PresentationContainer
	position relative
	margin 2rem 0 2rem

.sandbox
	position relative
	display grid
	grid-template-columns 1fr 1fr
	gap 2rem 4rem
	/* Center items vertically in the sandbox */
	align-items center

	&.hidden
		opacity 0

.instruction-animation
	mix-blend-mode multiply
	display block
	margin 0 10rem 1rem
	width calc(100% - 20rem)

.preview
	position relative

input, button
	margin-top 1rem
	height 3.2rem
	font-size 1.2rem
	border 2px solid #000
	padding 0.5rem 1rem
	border-radius 0.5rem

input
	background #fff
	width 10rem
	text-align left
	margin-right 1rem
	border-width 1px
	font-size 1rem

	&::placeholder
		color #000s

button
	&:hover
		background #000
		color #fff

	&:disabled
		border-style dotted
		opacity .5

	svg
		display inline-block
		vertical-align middle
		margin 0 0 .2em 0.2em
</style>
