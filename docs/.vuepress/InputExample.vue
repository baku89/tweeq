<script setup lang="ts" generic="T extends Record<string, any>">
import {cloneDeep} from 'lodash-es'
import {Scheme, Viewport} from 'tweeq'
import {ref, shallowRef} from 'vue'

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
	<Viewport class="Example">
		<div class="input">
			<slot :modelValue="modelValue" :update="update" :options="localOptions" />
		</div>

		<div class="options">
			<InputComplex v-model="localOptions" :scheme="scheme" />
		</div>
	</Viewport>
</template>

<style lang="stylus" scoped>
.Example
	position relative
	padding 2rem 0
	display grid
	grid-template-columns min-content 1fr
	gap 4rem

.input
	width 15rem
</style>
