<script setup lang="ts">
import {vec2} from 'linearly'

import {InputGroup} from '../InputGroup'
import {InputTranslate} from '../InputTranslate'
import {InputVec} from '../InputVec'
import {InputEmits} from '../types'
import {InputPositionProps} from './types'

const model = defineModel<vec2>({required: true})

const props = defineProps<InputPositionProps>()

const emit = defineEmits<InputEmits>()
</script>

<template>
	<InputGroup class="TqInputPosition">
		<InputTranslate
			v-bind="props"
			v-model="model"
			:showOverlayLabel="true"
			@focus="emit('focus')"
			@blur="emit('blur')"
			@confirm="emit('confirm')"
		/>
		<InputVec
			v-bind="props"
			v-model="model"
			:icon="['char:X', 'char:Y']"
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
