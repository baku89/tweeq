<MultiSelectPopup />

# Components


## Common Properties

### Props

| Name | Type |  Description |
|------|---------|-------------|
| `modelValue` | `T`  | The model value |


### Attributes

| Name | Type |  Description |
|------|---------|-------------|
| `disabled` | `boolean` | Whether the input is disabled |
| `invalid` | `boolean` | Whether the input is invalid |
| `inline-position` | `'start' \| 'middle' \| 'end'` | The inline (normally horizontal) position of the input |
| `block-position` | `'start' \| 'middle' \| 'end'` | The block (normally vertical) position of the input |


### Events

| Name | Payload | Description |
|------|---------|-------------|
| `focus` | | Emitted when the input is focused or started tweaking |
| `update:modelValue` | `value: T` | Emitted when the model value is updated |
| `confirm` | | Emitted when the editing or tweaking is finished |
| `blur` | | Emitted when the input is blurred or finished tweaking |

## Input Components

### InputAngle

<DemoComponent
	name="InputAngle"
	:initialValue="0"
	:options="{quantizeStep: 30, angleOffset: 0}"
	:scheme="{
		quantizeStep: {type: 'number', step: 1, min: 1, max: 360, suffix: '°'},
		angleOffset: {type: 'number', ui: 'angle', step: 1, min: -180, max: 180},
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
</DemoComponent>

### InputButton

<DemoComponent
	name="InputButton"
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
</DemoComponent>

### InputCheckbox

<DemoComponent
	name="InputCheckbox"
	:initialValue="false"
	:scheme="{
		label: {type: 'string'},
		icon: {type: 'string'},
	}"
	:options="{label: '', icon: ''}"
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
</DemoComponent>

### InputColor

<DemoComponent
	name="InputColor"
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
</DemoComponent>

### InputDropdown

<DemoComponent
	name="InputDropdown"
	initialValue="apple"
	:scheme="{
		disabled: {type: 'boolean'},
		invalid: {type: 'boolean'},
	}"
	:options="{
		disabled: false,
		invalid: false,
	}"
	v-slot="{modelValue, options, listeners}"
>
	<InputDropdown
		:modelValue="modelValue"
		:options="['apple', 'banana', 'cherry']"
		v-bind="options"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
	/>
</DemoComponent>

### InputNumber

<DemoComponent
	name="InputNumber"
	:initialValue="0"
	:scheme="{
		min: {type: 'number'},
		max: {type: 'number'},
		bar: {type: 'number'},
		clampMin: {type: 'boolean'},
		clampMax: {type: 'boolean'},
		step: {type: 'number', min: 0},
		precision: {
			type: 'number',
			min: 0,
			max: 10,
			step: 1,
			clampMin: true,
			clampMax: true,
		},
		disabled: {type: 'boolean'},
		invalid: {type: 'boolean'},
		prefix: {type: 'string'},
		suffix: {type: 'string'},
		leftIcon: {type: 'string'},
		rightIcon: {type: 'string'},
	}"
	:options="{
		min: 0,
		max: 2,
		clampMin: false,
		clampMax: false,
		step: 0,
		precision: 4,
		prefix: '',
		suffix: '',
		disabled: false,
		invalid: false,
		leftIcon: '',
		rightIcon: '',
		bar: 0,
	}"
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
</DemoComponent>

### InputPosition

<DemoComponent
	name="InputPosition"
	:initialValue="[0, 0]"
	:scheme="{}"
	:options="{}"
	v-slot="{modelValue, options, listeners}"
>
	<InputPosition
		:modelValue="modelValue"
		v-bind="options"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
		:min="-100"
		:max="100"
	/>
</DemoComponent>

### InputRadio

<DemoComponent
	name="InputRadio"
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
</DemoComponent>

### InputSize

<DemoComponent
	name="InputSize"
	:initialValue="[100, 250]"
	:scheme="{}"
	:options="{}"
	v-slot="{modelValue, options, listeners}"
>
	<InputSize
		:modelValue="modelValue"
		v-bind="options"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
	/>
</DemoComponent>

### InputString

<DemoComponent
	name="InputString"
	initialValue="Baby salmon"
	:scheme="{
		disabled: {type: 'boolean'},
		invalid: {type: 'boolean'},
	}"
	:options="{
		disabled: false,
		invalid: false,
	}"
	v-slot="{modelValue, options, listeners}"
>
	<InputString
		:modelValue="modelValue"
		v-bind="options"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
	/>
</DemoComponent>

### InputSwitch

<DemoComponent
	name="InputSwitch"
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
</DemoComponent>

### InputTime

<DemoComponent
	name="InputTime"
	:initialValue="0"
	:scheme="{
		frameRate: {type: 'number', min: 1, max: 60, step: 1},
		min: {type: 'number'},
		max: {type: 'number'},
	}"
	:options="{frameRate: 24, min: 0, max: 100000}"
	v-slot="{modelValue, options, listeners}"
>
	<InputTime
		:modelValue="modelValue"
		v-bind="options"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
	/>
</DemoComponent>


### InputTranslate

<DemoComponent
	name="InputTranslate"
	:initialValue="[0, 0]"
	:scheme="{}"
	:options="{}"
	v-slot="{modelValue, options, listeners}">
	<InputTranslate
		:modelValue="modelValue"
		v-bind="options"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
		:min="0"
		:max="100"
	/>
</DemoComponent>

### InputVec

<DemoComponent
	name="InputVec"
	:initialValue="[0, 0, 0, 0]"
	:scheme="{}"
	:options="{}"
	v-slot="{modelValue, options, listeners}">
	<InputVec
		:modelValue="modelValue"
		v-bind="options"
		@update:modelValue="listeners.update"
		@focus="listeners.focus"
		@blur="listeners.blur"
		@confirm="listeners.confirm"
	/>
</DemoComponent>
