<script setup lang="ts" generic="T extends Record<string, any>">
import {cloneDeep} from 'lodash-es'
import {ref, shallowRef} from 'vue'

import {Scheme} from '../../src'

interface Props {
	initialValue?: number | string
	scheme: Scheme<T>
	options: T
}

const props = defineProps<Props>()

const localOptions = shallowRef<T>(cloneDeep(props.options))

const modelValue = ref(props.initialValue)

function update(value: any) {
	modelValue.value = value
}
</script>

<template>
	<div class="Example">
		<div class="Example__input">
			<slot :modelValue="modelValue" :update="update" :options="localOptions" />
		</div>

		<div class="options">
			<InputComplex v-model="localOptions" :scheme="scheme" />
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
