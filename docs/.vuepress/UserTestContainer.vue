<script setup lang="ts" generic="T extends Record<string, any>">
import {useUrlSearchParams} from '@vueuse/core'
import {kebab} from 'case'
import {Icon, InputComplex, Viewport} from 'tweeq'
import {computed, ref, shallowRef, watch} from 'vue'

interface Props {
	title: string
	initialValue: T
	targets: T[]
	scheme: any
}

const props = defineProps<Props>()

defineSlots<{
	default(props: {modelValue: T}): any
	spectrum(props: {modelValue: T; update: (value: T) => void}): any
}>()

const name = ref('')
const occupation = ref('')

const searchParams = useUrlSearchParams()

const spectrum = computed(() => {
	const value = searchParams.sp

	if (value === kebab(props.title)) return true

	if (!value || typeof value !== 'object') return false

	return value.includes(kebab(props.title))
})

const currentTask = ref<'introduction' | number | 'result'>(0) //'introduction')

let startTime = 0

watch(currentTask, task => {
	if (task === 'result' || (typeof task === 'number' && task >= 1)) {
		const userData: ControlUserData = {
			history: controlHistory,
			totalTime: new Date().getTime() - startTime,
		}
		allUserDatas.push(userData)
	}

	startTime = new Date().getTime()
})

const target = computed(() =>
	typeof currentTask.value === 'number'
		? props.targets[currentTask.value]
		: null
)

const modelValue = shallowRef(props.initialValue)

type ControlHistory = [time: number, value: T]
type ControlUserData = {
	history: ControlHistory[]
	totalTime: number
}

const controlHistory: ControlHistory[] = []
const allUserDatas: ControlUserData[] = []

function update(value: T) {
	modelValue.value = value
	controlHistory.push([new Date().getTime() - startTime, value])
}

function nextTask() {
	if (typeof currentTask.value !== 'number') return

	if (currentTask.value === props.targets.length - 1) {
		currentTask.value = 'result'
	} else {
		currentTask.value++
	}
}

const userDataJSON = computed(() => {
	return JSON.stringify({
		ui: spectrum.value ? 'spectrum' : 'tweeq',
		title: props.title,
		name,
		occupation,
		allUserDatas,
	})
})

function downloadUserData() {
	const blob = new Blob([userDataJSON.value], {type: 'text/plain'})
	const url = URL.createObjectURL(blob)

	const timestamp = new Date().toString()

	const a = document.createElement('a')
	a.href = url
	a.download = `Tweeq_Evaluation_${props.title}&name=${name.value}&date=${timestamp}.json`
	a.click()
}

const hasNext = computed(() => {
	return (
		typeof currentTask.value === 'number' &&
		currentTask.value < props.targets.length - 1
	)
})
</script>

<template>
	<Viewport class="UserTestContainer">
		<ClientOnly>
			<div
				class="sandbox"
				:class="{
					hidden: typeof currentTask !== 'number',
				}"
			>
				<div class="preview">
					<h3>Preview</h3>
					<slot :modelValue="modelValue" />
					<Icon class="arrow-right" icon="mdi:arrow-right" />
				</div>
				<div class="target">
					<h3>Target</h3>
					<slot :modelValue="target ?? modelValue" />
				</div>
				<div class="parameters">
					<h3>Parameters</h3>
					<template v-if="spectrum">
						<slot name="spectrum" :modelValue="modelValue" :update="update" />
					</template>
					<InputComplex
						v-else
						:modelValue="modelValue"
						:scheme="scheme"
						@update:modelValue="update"
					/>
				</div>
				<div class="buttons">
					<p>
						<strong>Task</strong>: Adjust the <em>Parameters</em> to match the
						<em>Preview</em> with the <em>Target</em> as closely as possible.
						When you're satisfied, press the <em>Complete</em> button.
					</p>
					<p lang="ja">
						<strong>タスク</strong>:
						<em>Parameters</em>を調整して、<em>Preview</em>を
						<em>Target</em
						>に近づけてください。あなたの感覚で十分だと思ったら、<em
							>Complete</em
						>
						ボタンを押してください。
					</p>
					<button class="complete" @click="nextTask">
						Complete<Icon :icon="hasNext ? 'mdi:arrow-right' : 'mdi:check'" />
					</button>
					<span class="progress"
						>({{ typeof currentTask === 'number' ? currentTask : 0 }}/{{
							props.targets.length
						}})</span
					>
				</div>
			</div>
			<div v-if="currentTask === 'introduction'" class="introduction">
				<div class="introduction-content">
					<img
						class="instruction-animation"
						src="./public/assets/instruction.webp"
						alt="User Test"
					/>
					<p>
						<strong
							>Task: Adjust the <em>Parameters</em> to match the
							<em>Preview</em> with the <em>Target</em> as closely as possible.
							When you're satisfied, press the <em>Complete</em> button.</strong
						>
						During the test, all of your changes on the parameters are recorded
						and used to evaluate the performance of the library. If you agree
						with the conditions, please fill in your <em>Name</em> and
						<em>Occupation</em> and hit the <em>Start</em> button to proceed the
						test.
					</p>
					<p lang="ja">
						<strong
							>タスク: <em>Parameters</em>を調整して、<em>Preview</em>を
							<em>Target</em
							>に近づけてください。あなたの感覚で十分だと思ったら、<em
								>Complete</em
							>
							ボタンを押してください。</strong
						>
						このユーザーテスト中におけるあなたのパラメーターの変更履歴は記録され、
						ライブラリのパフォーマンスを評価するために使用されます。同意する場合は、可能な範囲でお名前やハンドルネーム（<em>Name</em>）とご職業（<em>Occupation</em>）を入力し、<em>Start</em>ボタンを押してテストを開始してください。
					</p>
					<p style="text-align: right">
						<input v-model="name" placeholder="Name" type="text" />
						<input v-model="occupation" placeholder="Occupation" type="text" />
						<button
							class="complete"
							:disabled="name === '' || occupation === ''"
							@click="currentTask = 0"
						>
							Start<Icon icon="mdi:arrow-right" />
						</button>
					</p>
				</div>
			</div>
			<div v-if="currentTask === 'result'" class="introduction">
				<div class="introduction-content">
					<p>
						Thank you for your participation. Please hit the download button
						below and send the text file to the experimenter.
					</p>
					<p lang="ja">
						ご協力ありがとうございました。以下のボタンを押して、テキストファイルをダウンロードし、実験者に送信してください。
					</p>
					<button class="download" @click="downloadUserData">
						Download<Icon icon="mdi:arrow-down" />
					</button>
				</div>
			</div>
		</ClientOnly>
	</Viewport>
</template>

<style lang="stylus" scoped>
.UserTestContainer
	position relative
	margin 2rem 0 2rem

.sandbox
	position relative
	display grid
	grid-template-columns 1fr 1fr
	gap 2rem 4rem

	&.hidden
		opacity 0

.instruction-animation
	mix-blend-mode multiply
	display block
	margin 0 10rem 1rem
	width calc(100% - 20rem)


.introduction
	position absolute
	top 0
	left 0
	right 0
	bottom 0
	display flex
	justify-content center
	align-items center
	border-radius .5rem
	z-index 10
	background var(--tq-color-border)

	.fullscreen &
		background transparent

	&.hidden
		display none

.introduction-content
	padding 0 4rem

.preview
	position relative

h3
	padding-top 0
	margin-top 0

p
	margin-bottom 1em
	font-size .85rem
	text-align justify

	&[lang="ja"]
		font-size .75rem

em
	font-family var(--tq-font-code)

.progress
	font-size 1.2rem
	padding-left 1.5rem
	font-family var(--tq-font-code)

.arrow-right
	position absolute
	width 2rem
	height 2rem
	left calc(100% + 2rem)
	top 58%
	transform translate(-50%, -50%)

input, button
	margin-top 1rem
	height 3.2rem
	font-size 1.2rem
	border 2px solid #000
	padding 0.5rem 1rem
	border-radius 0.5rem

input
	background #fff
	width 10rem
	text-align left
	margin-right 1rem
	border-width 1px
	font-size 1rem

	&::placeholder
		color #000s

button
	&:hover
		background #000
		color #fff

	&:disabled
		border-style dotted
		opacity .5

	svg
		display inline-block
		vertical-align middle
		margin 0 0 .2em 0.2em
</style>
