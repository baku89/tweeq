<script setup lang="ts">
import {vec2} from 'linearly'

import {InputGroup} from '../InputGroup'
import {InputTranslate} from '../InputTranslate'
import {InputVec} from '../InputVec'
import {InputEmits} from '../types'
import {InputPositionProps} from './types'

const props = defineProps<InputPositionProps>()

const emit = defineEmits<InputEmits<vec2>>()
</script>

<template>
	<InputGroup class="TqInputPosition">
		<InputTranslate
			v-bind="props"
			:showOverlayLabel="false"
			@update:modelValue="emit('update:modelValue', $event)"
			@focus="emit('focus')"
			@blur="emit('blur')"
			@confirm="emit('confirm')"
		/>
		<InputVec
			v-bind="props"
			:icon="['char:X', 'char:Y']"
			@update:modelValue="emit('update:modelValue', $event)"
			@focus="emit('focus')"
			@blur="emit('blur')"
			@confirm="emit('confirm')"
		/>
	</InputGroup>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputPosition
	gap 3px
</style>
