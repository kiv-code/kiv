<script setup lang="ts">
defineProps<{ label: string; modelValue?: number }>();
defineEmits<{ "update:modelValue": [value: number] }>();
</script>

<template>
	<label class="flex flex-col gap-1.5">
		<span class="text-[10px] font-semibold uppercase tracking-widest" style="color: var(--color-text-secondary)">
			{{ label }}
		</span>
		<input
			type="number"
			class="kiv-input"
			:value="modelValue"
			step="0.1"
			@input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
		/>
	</label>
</template>
