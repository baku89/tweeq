<script setup lang="ts">
import {IconIndicator} from '../IconIndicator'
import {useMultiSelectStore} from '../stores/multiSelect'

const multiSelect = useMultiSelectStore()

function swap() {
	multiSelect.captureValues()
	multiSelect.updateValues(values => values.reverse())
	multiSelect.conformValues()
}
</script>

<template>
	<IconIndicator icon="material-symbols:swap-vert" @click="swap" />
</template>
