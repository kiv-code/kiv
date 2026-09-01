import { GAP } from "@kivcode/nodes";
import { type FormEvent, useContext, useMemo, useState } from "react";
import type { KivNodeComponentProps } from "../node-props";
import { KivServicesContext } from "../services";

export interface FormNodeProps extends KivNodeComponentProps {
	submitLabel?: string;
	submitUrl?: string;
	method?: string;
	successMessage?: string;
	errorMessage?: string;
	layout?: string;
	gap?: string;
}

type Status = "idle" | "submitting" | "success" | "error";

export function FormNode({
	submitLabel,
	submitUrl,
	method,
	successMessage,
	errorMessage,
	layout,
	gap,
	slots,
	id,
	style,
	...rest
}: FormNodeProps) {
	const services = useContext(KivServicesContext);
	const [status, setStatus] = useState<Status>("idle");

	const formStyle = useMemo(() => {
		const resolvedLayout = layout ?? "stacked";
		return {
			display:
				resolvedLayout === "grid-2" ? ("grid" as const) : ("flex" as const),
			gridTemplateColumns: resolvedLayout === "grid-2" ? "1fr 1fr" : undefined,
			flexDirection:
				resolvedLayout === "stacked" ? ("column" as const) : undefined,
			flexWrap: resolvedLayout === "inline" ? ("wrap" as const) : undefined,
			alignItems:
				resolvedLayout === "inline" ? ("flex-end" as const) : undefined,
			gap: GAP[gap ?? "md"] ?? "16px",
			...style,
		};
	}, [layout, gap, style]);

	const submitButtonStyle = useMemo(
		() => ({
			gridColumn: (layout ?? "stacked") === "grid-2" ? "1 / -1" : undefined,
		}),
		[layout],
	);

	// No ApiClient configured (services.api is undefined) — don't intercept the
	// submit, let the browser POST/GET to submitUrl natively (progressive
	// enhancement instead of a hard requirement on a backend integration).
	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		if (!services?.api) return;
		event.preventDefault();
		const form = event.currentTarget;
		const data = Object.fromEntries(new FormData(form).entries());
		setStatus("submitting");
		try {
			await services.api.post(submitUrl ?? "", data);
			setStatus("success");
			form.reset();
		} catch {
			setStatus("error");
		}
	}

	return (
		<form
			id={id}
			action={submitUrl}
			method={method ?? "post"}
			style={formStyle}
			data-kiv-type="form"
			onSubmit={onSubmit}
			{...rest}
		>
			{slots?.default}
			<button
				type="submit"
				disabled={status === "submitting"}
				style={submitButtonStyle}
			>
				{submitLabel ?? "Submit"}
			</button>
			{status === "success" && (
				<p className="kiv-form__message kiv-form__message--success">
					{successMessage ?? "Thank you!"}
				</p>
			)}
			{status === "error" && (
				<p className="kiv-form__message kiv-form__message--error">
					{errorMessage ?? "Something went wrong."}
				</p>
			)}
		</form>
	);
}
