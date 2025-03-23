<MultiSelectPopup />

# Examples

## Three-Point Lighting

<ExampleThreePointLighting />

## 3-Band EQ

<ExampleContainer
	:initialValue="{low: 0, mid: 0, high: 0}"
	:scheme="{
		low: {type: 'number', ui: 'angle', min: -100, max: 100, icon: 'mdi-equalizer'},
		mid: {type: 'number', ui: 'angle', min: -100, max: 100, icon: 'mdi-equalizer'},
		high: {type: 'number', ui: 'angle', min: -100, max: 100, icon: 'mdi-equalizer'},
	}"
/>

## Color Palettes

<ExampleContainer
	:initialValue="{color1: '#000000', color2: '#FBF4EF', color3: '#E8EAEB', color4: '#AAABAE', color5: '#975E64'}"
	:scheme="{
		color1: {type: 'string', ui: 'color', icon: 'mdi-palette'},
		color2: {type: 'string', ui: 'color', icon: 'mdi-palette'},
		color3: {type: 'string', ui: 'color', icon: 'mdi-palette'},
		color4: {type: 'string', ui: 'color', icon: 'mdi-palette'},
		color5: {type: 'string', ui: 'color', icon: 'mdi-palette'},
	}"
/>

## Bunch of Switches

<ExampleContainer
	:initialValue="{
		switch_1: true,
		switch_2: false,
		switch_3: true,
		switch_4: false,
		switch_5: true,
		switch_6: false,
		switch_7: true,
		switch_8: false,
		switch_9: true,
		switch_10: false,
	}"
	:scheme="{
		switch_1: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_2: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_3: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_4: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_5: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_6: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_7: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_8: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_9: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_10: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
	}"
/>

## List of Text Inputs

<ExampleContainer
	:initialValue="{
		text1: 'Hello',
		text2: 'World',
		text3: '!',
		text4: 'This is a long text input',
		text5: 'Another long text input',
	}"
	:scheme="{
		text1: {type: 'string'},
		text2: {type: 'string'},
		text3: {type: 'string'},
		text4: {type: 'string'},
	}"
/>