<script setup lang="ts">
defineProps<{
	lang?: string;
}>();
</script>

<template>
	<div :lang="lang" data-kiv-type="page">
		<slot />
	</div>
</template>
