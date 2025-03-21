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