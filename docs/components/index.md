# Components

## InputNumber

<Example v-slot='{modelValue, update}' :initialValue='.5'>
	<InputNumber :modelValue='modelValue' @update:modelValue='update' :min='0' :max='1' />
</Example>



## InputRotery

<Example v-slot='{modelValue, update}'>
	<InputRotery :modelValue='modelValue' @update:modelValue='update' :quantizeStep='30' />
</Example>