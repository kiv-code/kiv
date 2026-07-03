<script setup lang="ts">
defineProps<{ label: string; modelValue?: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
	<label class="flex flex-col gap-1.5">
		<span class="text-[10px] font-semibold uppercase tracking-widest" style="color: var(--color-text-secondary)">
			{{ label }}
		</span>
		<input
			type="text"
			class="kiv-input"
			:value="modelValue ?? ''"
			@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
		/>
	</label>
</template>
