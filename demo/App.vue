<script setup lang="ts">
import Tq, {useTweeq} from 'tweeq'
import {ref} from 'vue'

import {useSmartKnob} from '../src/stores/smartKnob'

useTweeq('com.baku89.tweeq-demo', {
	colorMode: 'auto',
	accentColor: '#0000ff',
})

const smartKnob = useSmartKnob()

const value = ref(100)

smartKnob.setConfig({
	min: 0,
	max: 100,
	value: 0,
	color: '#4169E1',
	format: value => `${value}%`,
})

smartKnob.on('change', v => {
	value.value = v
})
</script>

<template>
	<Tq.ParameterGrid style="width: 50rem; margin: 10vh auto">
		<Tq.Parameter label="Value">
			<Tq.InputNumber
				v-model="value"
				:min="0"
				:max="100"
				:step="1"
				suffix="%"
				@update:modelValue="smartKnob.setValue($event)"
			/>
		</Tq.Parameter>
		<Tq.Parameter label="Smartknob">
			<Tq.InputButton
				:label="smartKnob.connected ? 'Disconnect' : 'Connect'"
				:icon="smartKnob.connected ? 'mdi:knob' : 'mdi:connection'"
				style="width: min-content"
				@click="smartKnob.toggleConnection"
			/>
		</Tq.Parameter>
	</Tq.ParameterGrid>
</template>
