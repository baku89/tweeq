<script lang="ts" setup generic="T">
import {uniqueId} from 'lodash-es'
import {computed} from 'vue'

import {type InputEmits, type LabelizerProps, useLabelizer} from '../types'
import {Icon} from '../Icon'

interface CompleteOption {
	value: T
	label: string
}

type Props = LabelizerProps<T> & {
	modelValue: T
	icons?: string[]
}

const model = defineModel<T>({required: true})

const props = defineProps<Props>()

defineEmits<InputEmits>()

defineSlots<{
	option: {label: string; value: T; isActive: boolean}
}>()

const labelizer = useLabelizer(props)
const id = uniqueId('InputRadio_')

const completeOptions = computed<CompleteOption[]>(() => {
	return props.options.map(op => {
		return {value: op, label: labelizer.value(op)}
	})
})

function onChange(index: number) {
	const newValue = completeOptions.value[index].value
	model.value = newValue
}
</script>

<template>
	<ul class="TqInputRadio">
		<li
			v-for="({value, label}, index) in completeOptions"
			:key="label"
			class="list"
		>
			<input
				:id="id + value"
				type="radio"
				:name="id"
				:checked="model === value"
				@change="onChange(index)"
			/>
			<label :for="id + value" :class="{active: model === value}">
				<slot
					name="option"
					:label="label"
					:value="value"
					:isActive="model === value"
				>
					<Icon class="icon" v-if="icons?.[index]" :icon="icons[index]" />
					{{ label }}
				</slot>
			</label>
		</li>
	</ul>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputRadio
	position relative
	display flex
	overflow hidden
	background var(--tq-color-input)
	height var(--tq-input-height)
	border-radius var(--tq-radius-input)
	padding 0
	gap 1px
	hover-transition(background)

.list
	flex-grow 1

input
	position absolute
	opacity 0

label
	display flex
	line-height var(--tq-input-height)
	height var(--tq-input-height)
	border-radius var(--tq-radius-input)
	overflow hidden
	text-align center
	justify-content center
	align-items center
	hover-transition(background, color)
	padding 0 0.75em

	&:hover
		background var(--tq-color-input-hover)

	&.active
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)
		transition none

		&:hover
			background var(--tq-color-accent-hover)

.icon
	margin-right 0.5em
</style>
