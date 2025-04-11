---
title: Twidgets
sidebar: false
pageClass: user-study
---

<MultiSelectPopup />

# Twidgets: Parameter-Tuning GUI Widgets by/for Creative Professionals

Anonymous Author(s) / UIST 2025

**The widgets below have only been tested on Google Chrome version 134 or later.**

## 4.2 Drag-to-Tweak Interaction and Overlay UI

### 4.2.1 InputNumber

<ExampleContainer
	:initialValue="{opacity: 10}"
	:scheme="{
		opacity: {type: 'number', min: 0, max: 100, suffix: '%'},
	}"
/>

#### Gestures

 - `Click`: edit the number
 - While focusing
	- `↑` / `↓`: increase / decrease the number by 1
	- `Shift + ↑` / `Shift + ↓`: increase / decrease the number by 10
	- `Option + ↑` / `Option + ↓`: increase / decrease the number by 0.1
	- `Command + =`: enable expression mode
 - `Drag`: tweak the number
	- Drag vertically: increase and decrease the adjustment sensitivity
	- `Shift`: increase the adjustment sensitivity
	- `Alt`: decrease the adjustment sensitivity
	- `Q`: snap to the times of 10

### 4.2.2 Rotery Knobs

<ExampleContainer
	:initialValue="{angle: 0}"
	:scheme="{
		angle: {type: 'number', ui: 'angle'},
	}"
/>

#### Gestures

 - `Drag`
	- `A` / Drag on the line indicator: set the angle absolutely
	- `R` / Drag the remaining part of the knob: rotate it relative to the current angle
	- `Shift` or `Q`: snap to the times of 45°

### 4.2.3 Color Inputs

<ExampleContainer
	:initialValue="{fill: '#8282ee'}"
	:scheme="{
		fill: {type: 'string', ui: 'color', alpha: true},
	}"
/>

#### Gestures

 - `Click`: toggle the color picker popup
 - `Drag`: tweak the color reatively
	 - `Shift` or `H`: adjust the hue
	 - `S` / `V`: adjust the saturation / brightness (value)
	 - `Alt` or `A`: adjust the alpha
	 - `R` / `G` / `B`: adjust the red / green / blue channel

### 4.2.4 Boolean Inputs

<ExampleContainer
	:initialValue="{switch: true, checkbox: true}"
	:scheme="{switch: {type: 'boolean'}, checkbox: {type: 'boolean', ui: 'checkbox'}}"
/>

#### Gestures

 - `Click`: toggle the switch
 - `Swipe` `Left` / `Right`: set the boolean value to true / false


### 4.2.5 Other Domain-Specific Inputs (Position)

<ExampleContainer
	:initialValue="{offset: [0, 0]}"
	:scheme="{
		offset: {type: 'vec2', ui: 'position'},
	}"
/>

#### Gestures

 - `Drag`: adjust the position
	 - `Shift`: increase the adjustment sensitivity
	 - `Alt`: decrease the adjustment sensitivity
	 - `X` / `0`: constrain the tweak to the X axis
	 - `Y` / `1`: constrain the tweak to the Y axis

### 4.2.6 Other Domain-Specific Inputs (Timecode)

<ExampleContainer
	:initialValue="{duration: 90}"
	:scheme="{
		duration: {type: 'number', ui: 'time', frameRate: 24, min: 0},
	}"
/>

#### Gestures

 - `Click`: edit the timecode
 - `Right Click`: toggle the time unit between SMTPE and frames
 - `Drag` on the time indicator: adjust the time
	 - `Shift`: increase the adjustment sensitivity
	 - `Alt`: decrease the adjustment sensitivity
	 - `H` / `M` / `S` / `F`: adjust the hour / minute / second / frame
	 - `Q`: only change the currently selected unit


## 4.3 Simultaneous Parameter Tuning

Click widgets while pressing `Ctrl` (Windows) or `Command` (macOS) to select multiple widgets. `Shift` to select multiple widgets in a row.

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

<ExampleContainer
	:initialValue="{
		switch_1: true,
		switch_2: false,
		switch_3: true,
		switch_4: false,
		switch_5: true,
		switch_6: false,
	}"
	:scheme="{
		switch_1: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_2: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_3: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_4: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_5: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
		switch_6: {type: 'boolean', ui: 'switch', icon: 'mdi-toggle-switch'},
	}"
/>

## 6.1 User Study Design

Here are the example applications that we used in the informal expert user study.

### Task 1: Drop Shadow

<UserTestDropShadow />

### Task 2: Spring Simulation

<UserTestSpring />

### Task 3: Timecode

<UserTestTime />

### Task 4: Three-Point Lighting

<UserTestThreePointLighting />

<div style="height: 30vh"></div>
