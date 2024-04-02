---
home: true
---

<div class="badges">
	<p>
		<a href="http://spdx.org/licenses/MIT">
			<img src="https://img.shields.io/npm/l/tweeq.svg?style=flat-square" alt="npm license">
		</a>
	</p>
</div>

Tweeq is a collection of [Vue.js](https://vuejs.org) components for design tools. The components range from fundamental UIs such as numeric sliders, color pickers, to advanced and niche controls like a cubic-bezier editor. It also supports various micro-interactions suitable for professional use.

It is continuously developed by the visual artist [Baku Hashimoto](https://baku89.com).

# How to Use

### Installation

```bash
yarn add baku89/tweeq pinia
```

### index.ts 

```ts
import {createPinia} from 'pinia'

app.use(pinia)
```

### App.vue

```ts
import {useTweeq} from 'baku89/tweeq'

useTweeq()
```


