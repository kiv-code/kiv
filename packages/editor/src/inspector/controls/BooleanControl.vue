<script setup lang="ts">
defineProps<{ label: string; modelValue?: boolean }>();
defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>

<template>
	<div
		class="flex cursor-pointer select-none items-center justify-between rounded-md px-2.5 py-2"
		style="background: var(--color-surface-sunken); border: 1px solid var(--color-border)"
		@click="$emit('update:modelValue', !modelValue)"
	>
		<span class="text-xs" style="color: var(--color-text-secondary)">{{ label }}</span>
		<div
			class="relative h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200"
			:style="{
				background: modelValue ? 'var(--color-accent)' : 'var(--color-track)',
				boxShadow: modelValue ? '0 0 0 1px var(--color-accent)' : 'inset 0 0 0 1px var(--color-track-border)',
			}"
		>
			<span
				class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
				:style="{ transform: modelValue ? 'translateX(16px)' : 'translateX(0)' }"
			/>
		</div>
	</div>
</template>
