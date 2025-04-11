<MultiSelectPopup />

# Examples

## Many Sliders

<ExampleContainer
	:initialValue="{number1: 10, number2: 20, number3: 30, number4: 40, number5: 50}"
	:scheme="{
		number1: {type: 'number', min: 0, max: 100},
		number2: {type: 'number', min: 0, max: 100},
		number3: {type: 'number', min: 0, max: 100},
		number4: {type: 'number', min: 0, max: 100},
		number5: {type: 'number', min: 0, max: 100},
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

## Three Angle Inputs

<ExampleContainer
	:initialValue="{low: 0, mid: 0, high: 0}"
	:scheme="{
		low: {type: 'number', ui: 'angle', min: -100, max: 100, icon: 'mdi-equalizer'},
		mid: {type: 'number', ui: 'angle', min: -100, max: 100, icon: 'mdi-equalizer'},
		high: {type: 'number', ui: 'angle', min: -100, max: 100, icon: 'mdi-equalizer'},
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

## List of File Names

<ExampleContainer
	:initialValue="{
		file_1: 'icon42.svg',
		file_2: 'logo17.svg',
		file_3: 'graphic3.svg',
		file_4: 'illustration89.svg',
		file_5: 'diagram25.svg',
		file_6: 'chart64.svg',
		file_7: 'banner31.svg',
		file_8: 'avatar12.svg',
		file_9: 'background76.svg',
		file_10: 'pattern58.svg',
	}"
	:scheme="{
		file_1: {type: 'string', icon: 'mdi:file'},
		file_2: {type: 'string', icon: 'mdi:file'},
		file_3: {type: 'string', icon: 'mdi:file'},
		file_4: {type: 'string', icon: 'mdi:file'},
		file_5: {type: 'string', icon: 'mdi:file'},
		file_6: {type: 'string', icon: 'mdi:file'},
		file_7: {type: 'string', icon: 'mdi:file'},
		file_8: {type: 'string', icon: 'mdi:file'},
		file_9: {type: 'string', icon: 'mdi:file'},
		file_10: {type: 'string', icon: 'mdi:file'},
	}"
/>