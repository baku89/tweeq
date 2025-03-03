<MultiSelectPopup />

# Components

## InputNumber

<InputExample
	:initialValue="0"
	:scheme="{
		min: {type: 'number'},
		max: {type: 'number'},
		bar: {type: 'number'},
		clampMin: {type: 'boolean'},
		clampMax: {type: 'boolean'},
		step: {type: 'number', min: 0, step: 0.01},
		disabled: {type: 'boolean'},
		invalid: {type: 'boolean'},
		prefix: {type: 'string'},
		suffix: {type: 'string'},
		leftIcon: {type: 'string'},
		rightIcon: {type: 'string'},
	}"
	:options="{min: 0, max: 2, clampMin: false, clampMax: false, step: 0, prefix: '', suffix: '', disabled: false, invalid: false, leftIcon: '', rightIcon: '', bar: 0}"
	v-slot="{modelValue, update, options}"
>
	<InputNumber
		:modelValue="modelValue"
		@update:modelValue="update"
		v-bind="options"
	/>
</InputExample>

## InputRotery

<InputExample
	:initialValue="0"
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
</InputExample>

## InputColor

<InputExample
	initialValue="#ff0000"
	:scheme="{}"
	:options="{}"
	v-slot="{modelValue, update}"
>
	<InputColor
		:modelValue="modelValue"
		@update:modelValue="update"
	/>
</InputExample>
