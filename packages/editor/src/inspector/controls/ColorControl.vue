<script setup lang="ts">
defineProps<{ label: string; modelValue?: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
	<label class="flex flex-col gap-1.5">
		<span class="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
			{{ label }}
		</span>
		<div class="flex items-center gap-2">
			<div class="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border)]">
				<input
					type="color"
					class="absolute inset-0 h-full w-full cursor-pointer border-0 p-0 opacity-0"
					:value="modelValue ?? '#000000'"
					@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
				/>
				<span
					class="block h-full w-full rounded-[var(--radius-sm)]"
					:style="{ background: modelValue ?? '#000000' }"
				/>
			</div>
			<input
				type="text"
				class="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-2.5 py-1.5 font-mono text-xs text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30"
				:value="modelValue ?? ''"
				@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
			/>
		</div>
	</label>
</template>
