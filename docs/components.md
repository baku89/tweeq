<MultiSelectPopup />

# Components

## Input Components

### InputAngle

<DemoComponent
	name="InputAngle"
	:initialValue="0"
	:options="{snap: 45, angleOffset: 0}"
	:scheme="{
		snap: {type: 'number', step: 1, min: 1, max: 360, snap: 5, suffix: '°'},
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

 - `Drag`
	- `A` / Drag on the line indicator: set the angle absolutely
	- `R` / Drag the remaining part of the knob: rotate it relative to the current angle
	- `Shift` or `Q`: snap to the times of `snap`

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

 - `Click`: toggle the checkbox
 - `Swipe Right`: turn on the checkbox
 - `Swipe Left`: turn off the checkbox
 - `T` or `Y` or `1` or `p`: turn on the checkbox
 - `F` or `N` or `0` or `m`: turn off the checkbox

### InputColor

<DemoComponent
	name="InputColor"
	initialValue="#ff0000"
	:scheme="{
		alpha: {type: 'boolean'},
	}"
	:options="{alpha: true}"
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

 - `Click`: toggle the color picker popup
 - `Drag`: tweak the color reatively
	 - `Shift` or `H`: adjust the hue
	 - `S` / `V`: adjust the saturation / brightness (value)
	 - `Alt` or `A`: adjust the alpha
	 - `R` / `G` / `B`: adjust the red / green / blue channel
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

 - `Click`: edit the number
 - While focusing
	- `↑` / `↓`: increase / decrease the number by 1
	- `Shift + ↑` / `Shift + ↓`: increase / decrease the number by `snap`
	- `Option + ↑` / `Option + ↓`: increase / decrease the number by 0.1
	- `Command + =`: enable expression mode
 - `Drag`: tweak the number
	- Drag vertically: increase and decrease the scale of adjustment
	- `Shift`: increase the scale of adjustment
	- `Alt`: decrease the scale of adjustment
	- `Q`: snap to the times of `snap`


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

 - `Drag`: adjust the position
	 - `Shift`: increase the scale of adjustment
	 - `Alt`: decrease the scale of adjustment
	 - `X` / `0`: constrain the tweak to the X axis
	 - `Y` / `1`: constrain the tweak to the Y axis

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

 - `Click` on the chain icon<Icon icon="radix-icons:link-1" />: toggle the aspect ratio constraint

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

 - The gestures are the same as [InputCheckbox](#inputcheckbox)

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

 - `Click`: edit the time code
 - `Right Click`: toggle the time unit between SMTPE and frames
 - `Drag` on the time indicator: adjust the time
	 - `Shift`: increase the scale of adjustment
	 - `Alt`: decrease the scale of adjustment
	 - `H` / `M` / `S` / `F`: adjust the hour / minute / second / frame
	 - `Q`: only change the currently selected unit

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
