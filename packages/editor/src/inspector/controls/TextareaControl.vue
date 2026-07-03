<script setup lang="ts">
defineProps<{ label: string; modelValue?: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
	<label class="flex flex-col gap-1.5">
		<span class="text-[10px] font-semibold uppercase tracking-widest" style="color: var(--color-text-secondary)">
			{{ label }}
		</span>
		<textarea
			rows="3"
			class="kiv-input resize-y"
			:value="modelValue ?? ''"
			@input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
		/>
	</label>
</template>
