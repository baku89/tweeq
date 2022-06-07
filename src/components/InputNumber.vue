<template>
	<input class='InputNumber' type="number" :value="modelValue" />
</template>

<script lang="ts">

import { defineComponent } from "vue";

export default defineComponent({
	name: 'InputNumber',
	props: {
		modelValue: {
			type: Number,
			required: true
		}
	}
})

</script>

<style lang="stylus">

.InputNumber
	color red

</style>