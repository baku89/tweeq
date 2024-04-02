<script setup lang="ts" generic="T extends Record<string, any>">
import {ref} from 'vue'
import {cloneDeep} from 'lodash'

import {Scheme} from '../../src/InputComplex'

interface Props {
	initialValue?: number
	scheme: Scheme<T>
	options: T
}

const props = withDefaults(defineProps<Props>(), {
	initialValue: 0,
})

const localOptions = ref(cloneDeep(props.options))

const modelValue = ref(props.initialValue)

function update(value: number) {
	modelValue.value = value
}
</script>

<template>
	<div class="Example">
		<div class="Example__input">
			<slot :modelValue="modelValue" :update="update" :options="localOptions" />
		</div>

		<div class="options">
			<InputComplex :scheme="scheme" v-model="localOptions" />
		</div>
	</div>
</template>

<style lang="stylus">
@import '../../src/setup.styl'

.Example
	setup()
	position relative
	padding 2rem 0
	display grid
	grid-template-columns min-content 1fr
	gap 4rem

	&__input
		width 15rem
</style>
