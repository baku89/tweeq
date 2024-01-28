import {throttledWatch} from '@vueuse/core'
import chroma from 'chroma-js'
import EventEmitter from 'eventemitter3'
import {scalar} from 'linearly'
import {defineStore} from 'pinia'
import {PB} from 'smartknobjs-proto'
import {SmartKnobWebSerial} from 'smartknobjs-webserial'
import {computed, ref, watch} from 'vue'

export type NoUndefinedField<T> = {
	[P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>>
}

interface SmartKnobConfig {
	min: number
	max: number
	value: number
	label?: string
	format?: (value: number) => string
	color?: string
}

function convertConfigToProtobuf(config: SmartKnobConfig): PB.ISmartKnobConfig {
	return {
		position: config.value,
		subPositionUnit: 0,
		positionNonce: Math.floor(Math.random() * 255),
		minPosition: config.min,
		maxPosition: config.max,
		positionWidthRadians: scalar.rad(300) / (config.max - config.min),
		detentStrengthUnit: 1,
		endstopStrengthUnit: 1,
		snapPoint: 0.7,
		text: config.label ?? '',
		detentPositions: [],
		snapPointBias: 0,
		baseColor: chroma(config.color ?? '#ff0000').num(),
		positionOffsetRadians: -1,
		positionText: config.format ? config.format(config.value) : '',
		meterType: PB.MeterType.RADIAL,
	}
}

export const useSmartKnob = defineStore('tweeq.smartKnob', () => {
	let connect: () => Promise<void> = async () => {}
	let disconnect: () => Promise<void> = async () => {}
	let toggleConnection: () => Promise<void> = async () => {}

	let serialPort: SerialPort | null = null

	const smartKnob = ref<null | SmartKnobWebSerial>(null)
	const connected = computed(() => !!smartKnob.value)

	const lastState = ref<null | PB.ISmartKnobState>(null)

	const emitter = new EventEmitter()

	let lastConfig: SmartKnobConfig = {
		min: 0,
		max: -1,
		value: 0,
	}

	if (navigator.serial) {
		const onDisconnect = () => {
			serialPort = null
			smartKnob.value = null
			lastState.value = null
		}

		connect = async () => {
			serialPort = await navigator.serial.requestPort({
				filters: SmartKnobWebSerial.USB_DEVICE_FILTERS,
			})

			serialPort.addEventListener('disconnect', onDisconnect)

			smartKnob.value = new SmartKnobWebSerial(
				serialPort,
				message => {
					if (message.payload === 'smartknobState' && message.smartknobState) {
						lastState.value = message.smartknobState
					}
				},
				{baudRate: 115200}
			)

			init(smartKnob.value as SmartKnobWebSerial)
		}

		disconnect = async () => {
			if (serialPort) {
				serialPort.removeEventListener('disconnect', onDisconnect)
				await serialPort.close()
			}
			onDisconnect()
		}

		toggleConnection = async () => {
			if (serialPort) {
				await disconnect()
			} else {
				await connect()
			}
		}
	}

	let lastValue: number = NaN
	watch(
		() => lastState.value,
		(state, prevState) => {
			if (
				typeof state?.currentPosition === 'number' &&
				state.currentPosition !== prevState?.currentPosition &&
				state.currentPosition !== lastValue
			) {
				emitter.emit('change', state.currentPosition)
			}
		},
		{flush: 'sync'}
	)

	function init(smartKnob: SmartKnobWebSerial) {
		smartKnob.openAndLoop()

		setConfig(lastConfig)
	}

	let stopPositionTextUpdator: ReturnType<typeof throttledWatch> = () => null

	function setConfig(config: SmartKnobConfig) {
		lastConfig = config
		const pbConfig = convertConfigToProtobuf(config)
		smartKnob.value?.sendConfig(PB.SmartKnobConfig.fromObject(pbConfig))

		let sent: number = Infinity

		stopPositionTextUpdator()
		if (config.format) {
			const {format} = config

			stopPositionTextUpdator = throttledWatch(
				lastState,
				state => {
					if (typeof state?.currentPosition !== 'number') return

					if (state.currentPosition === sent) return

					sent = state.currentPosition

					const config: PB.ISmartKnobConfig = {
						...state.config,
						positionText: format(state.currentPosition),
					}

					smartKnob.value?.sendConfig(PB.SmartKnobConfig.fromObject(config))
				},
				{flush: 'sync', throttle: 1000 / 60}
			)
		}
	}

	function setValue(value: number) {
		lastValue = value
		const pbConfig = convertConfigToProtobuf({...lastConfig, value})
		smartKnob.value?.sendConfig(PB.SmartKnobConfig.fromObject(pbConfig))
	}

	return {
		connect,
		disconnect,
		toggleConnection,
		connected,
		setConfig,
		setValue,
		on: emitter.on.bind(emitter),
	}
})
