<script setup lang="ts">
defineProps<{ label: string; modelValue?: string; options: string[] }>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
	<label class="flex flex-col gap-1.5">
		<span class="text-[10px] font-semibold uppercase tracking-widest" style="color: var(--color-text-secondary)">
			{{ label }}
		</span>
		<select
			class="kiv-input"
			:value="modelValue ?? ''"
			@change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
		>
			<option
				v-for="opt in options"
				:key="opt"
				:value="opt"
				:selected="opt === modelValue"
			>
				{{ opt }}
			</option>
		</select>
	</label>
</template>
