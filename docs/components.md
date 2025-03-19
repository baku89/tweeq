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
	v-slot="{modelValue, options, listeners}"
>
	<InputNumber
		:modelValue="modelValue"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
		v-bind="options"
	/>
</InputExample>

## InputAngle

<InputExample
	:initialValue="0"
	:options="{quantizeStep: 30}"
	:scheme="{
		quantizeStep: {type: 'number', step: 1, min: 1, max: 360},
	}"
	v-slot='{modelValue, options, listeners}'
>
	<InputAngle
		:modelValue='modelValue'
		@update:modelValue='listeners.update'
		@focus='listeners.focus'
		@blur='listeners.blur'
		@confirm='listeners.confirm'
		v-bind='options'
	/>
</InputExample>

## InputColor

<InputExample
	initialValue="#ff0000"
	:scheme="{
		alpha: {type: 'boolean'},
	}"
	:options="{alpha: false}"
	v-slot="{modelValue, options, listeners}"
>
	<InputColor
		:modelValue="modelValue"
		v-bind="options"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
	/>
</InputExample>

## InputButton

<InputExample
	:initialValue="0"
	:scheme="{
		label: {type: 'string'},
		icon: {type: 'string'},
		subtle: {type: 'boolean'},
		blink: {type: 'boolean'},
	}"
	:options="{
		label: 'Click me',
		icon: '',
		subtle: false,
		blink: false,
	}"
	v-slot="{options}"
>
	<InputButton
		v-bind="options"
	/>
</InputExample>

## InputDropdown

<InputExample
	initialValue="apple"
	:scheme="{}"
	:options="{}"
	v-slot="{modelValue, listeners}"
>
	<InputDropdown
		:modelValue="modelValue"
		:options="['apple', 'banana', 'cherry']"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
	/>
</InputExample>

## InputRadio

<InputExample
	initialValue="apple"
	:scheme="{}"
	:options="{}"
	v-slot="{modelValue, listeners}"
>
	<InputRadio
		:modelValue="modelValue"
		:options="['apple', 'banana', 'cherry']"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
	/>
</InputExample>

## InputString

<InputExample
	initialValue="Baby salmon"
	:scheme="{}"
	:options="{}"
	v-slot="{modelValue, listeners}"
>
	<InputString
		:modelValue="modelValue"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
	/>
</InputExample>

## InputCheckbox

<InputExample
	:initialValue="false"
	:scheme="{
		label: {type: 'string'},
	}"
	:options="{label: ''}"
	v-slot="{modelValue, options, listeners}"
>
	<InputCheckbox
		:modelValue="modelValue"
		v-bind="options"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
	/>
</InputExample>

## InputSwitch

<InputExample
	:initialValue="false"
	:scheme="{
		label: {type: 'string'},
	}"
	:options="{label: ''}"
	v-slot="{modelValue, options, listeners}"
>
	<InputSwitch
		:modelValue="modelValue"
		v-bind="options"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
	/>
</InputExample>