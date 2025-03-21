<MultiSelectPopup />

# Examples

## 3-Channel DMX

<Sandbox
	:initialValue="{ch1: 0, ch2: 64, ch3: 128}"
	:scheme="{
		ch1: {label: 'Key Light', type: 'number', min: 0, max: 255, clampMin: true, clampMax: true, icon: 'mdi-lightbulb'},
		ch2: {label: 'Fill Light', type: 'number', min: 0, max: 255, clampMin: true, clampMax: true, icon: 'mdi-lightbulb'},
		ch3: {label: 'Back Light', type: 'number', min: 0, max: 255, clampMin: true, clampMax: true, icon: 'mdi-lightbulb'},
	}"
/>

## 3-Band EQ

<Sandbox
	:initialValue="{low: 0, mid: 0, high: 0}"
	:scheme="{
		low: {type: 'number', ui: 'angle', min: -100, max: 100, icon: 'mdi-equalizer'},
		mid: {type: 'number', ui: 'angle', min: -100, max: 100, icon: 'mdi-equalizer'},
		high: {type: 'number', ui: 'angle', min: -100, max: 100, icon: 'mdi-equalizer'},
	}"
/>

## Color Palettes

<Sandbox
	:initialValue="{color1: '#000000', color2: '#FBF4EF', color3: '#E8EAEB', color4: '#AAABAE', color5: '#975E64'}"
	:scheme="{
		color1: {type: 'string', ui: 'color', icon: 'mdi-palette'},
		color2: {type: 'string', ui: 'color', icon: 'mdi-palette'},
		color3: {type: 'string', ui: 'color', icon: 'mdi-palette'},
		color4: {type: 'string', ui: 'color', icon: 'mdi-palette'},
		color5: {type: 'string', ui: 'color', icon: 'mdi-palette'},
	}"
/>