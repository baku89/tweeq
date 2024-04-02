# Components

## InputNumber

<Example
	:initialValue="0"
	:scheme="{
		min: {type: 'number'},
		max: {type: 'number'},
		clampMin: {type: 'boolean'},
		clampMax: {type: 'boolean'},
		step: {type: 'number'},
	}"
	:options="{min: 0, max: 2, clampMin: false, clampMax: false, step: 0.1}"
	v-slot="{modelValue, update, options}"
>
	<InputNumber
		:modelValue="modelValue"
		@update:modelValue="update"
		v-bind="options"
	/>
</Example>

## InputRotery

<Example
	:options="{quantizeStep: 30}"
	:scheme="{
		quantizeStep: {type: 'number', step: 1, min: 1, max: 360},
	}"
	v-slot='{modelValue, update, options}'
>
	<InputRotery
		:modelValue='modelValue'
		@update:modelValue='update'
		v-bind='options'
	/>
</Example>
