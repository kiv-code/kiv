<script setup lang="ts">
import { GAP } from "@kivcode/nodes";
import { computed, inject, ref } from "vue";
import { KIV_SERVICES_KEY } from "../services";

const props = defineProps<{
	submitLabel?: string;
	submitUrl?: string;
	method?: string;
	successMessage?: string;
	errorMessage?: string;
	layout?: string;
	gap?: string;
}>();

const services = inject(KIV_SERVICES_KEY, null);
const status = ref<"idle" | "submitting" | "success" | "error">("idle");

const formStyle = computed(() => {
	const layout = props.layout ?? "stacked";
	return {
		display: layout === "grid-2" ? ("grid" as const) : ("flex" as const),
		gridTemplateColumns: layout === "grid-2" ? "1fr 1fr" : undefined,
		flexDirection: layout === "stacked" ? ("column" as const) : undefined,
		flexWrap: layout === "inline" ? ("wrap" as const) : undefined,
		alignItems: layout === "inline" ? ("flex-end" as const) : undefined,
		gap: GAP[props.gap ?? "md"] ?? "16px",
	};
});

const submitButtonStyle = computed(() => ({
	gridColumn: (props.layout ?? "stacked") === "grid-2" ? "1 / -1" : undefined,
}));

// No ApiClient configured (services.api is undefined) — don't intercept the
// submit, let the browser POST/GET to submitUrl natively (progressive
// enhancement instead of a hard requirement on a backend integration).
async function onSubmit(event: Event) {
	if (!services?.api) return;
	event.preventDefault();
	const form = event.target as HTMLFormElement;
	const data = Object.fromEntries(new FormData(form).entries());
	status.value = "submitting";
	try {
		await services.api.post(props.submitUrl ?? "", data);
		status.value = "success";
		form.reset();
	} catch {
		status.value = "error";
	}
}
</script>

<template>
	<form
		:action="submitUrl"
		:method="method ?? 'post'"
		:style="formStyle"
		data-kiv-type="form"
		@submit="onSubmit"
	>
		<slot />
		<button type="submit" :disabled="status === 'submitting'" :style="submitButtonStyle">
			{{ submitLabel ?? "Submit" }}
		</button>
		<p v-if="status === 'success'" class="kiv-form__message kiv-form__message--success">
			{{ successMessage ?? "Thank you!" }}
		</p>
		<p v-if="status === 'error'" class="kiv-form__message kiv-form__message--error">
			{{ errorMessage ?? "Something went wrong." }}
		</p>
	</form>
</template>

<style scoped>
.kiv-form__message {
	margin: 0;
	font-size: 14px;
}
.kiv-form__message--success {
	color: #16a34a;
}
.kiv-form__message--error {
	color: #dc2626;
}
</style>
