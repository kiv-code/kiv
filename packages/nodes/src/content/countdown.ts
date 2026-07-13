import { defineNode, f } from "@kivcode/engine";
import { escapeHtml, styleToString } from "../html-utils";
import { RADIUS } from "../scales";

export interface CountdownParts {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	expired: boolean;
}

/** Pure computation shared by the Vue component's live tick and toHtml's static snapshot. */
export function computeCountdownParts(
	targetDate: unknown,
	now: number = Date.now(),
): CountdownParts {
	const target =
		typeof targetDate === "string" ? Date.parse(targetDate) : Number.NaN;
	if (Number.isNaN(target) || target - now <= 0) {
		return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
	}
	const totalSeconds = Math.floor((target - now) / 1000);
	return {
		days: Math.floor(totalSeconds / 86400),
		hours: Math.floor((totalSeconds % 86400) / 3600),
		minutes: Math.floor((totalSeconds % 3600) / 60),
		seconds: totalSeconds % 60,
		expired: false,
	};
}

const COUNTDOWN_SIZE: Record<string, string> = {
	sm: "18px",
	md: "28px",
	lg: "40px",
};

function unitBoxHtml(
	value: number,
	label: string,
	showLabels: boolean,
	style: string,
	accentColor: string,
	fontSize: string,
): string {
	const numberStyle = styleToString({
		fontSize,
		fontWeight: "700",
		lineHeight: "1",
		color: style === "minimal" ? "inherit" : accentColor,
	});
	const boxStyle =
		style === "boxes"
			? styleToString({
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					padding: "12px 16px",
					borderRadius: RADIUS.md,
					background: "rgba(99, 102, 241, 0.08)",
					minWidth: "64px",
				})
			: styleToString({
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				});
	const labelHtml = showLabels
		? `<span style="${styleToString({ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" })}">${escapeHtml(label)}</span>`
		: "";
	return `<div style="${boxStyle}"><span style="${numberStyle}">${String(value).padStart(2, "0")}</span>${labelHtml}</div>`;
}

export const countdownNode = defineNode({
	type: "countdown",
	category: "content",
	label: "Countdown",
	icon: "timer",
	toHtml(props) {
		const style = String(props.countdownStyle ?? "boxes");
		const showLabels = props.showLabels !== false;
		const accentColor = String(props.accentColor ?? "#6366f1");
		const fontSize = COUNTDOWN_SIZE[String(props.size ?? "md")] ?? "28px";
		const parts = computeCountdownParts(props.targetDate);

		const daysLabel = String(props.daysLabel ?? "Days");
		const hoursLabel = String(props.hoursLabel ?? "Hours");
		const minutesLabel = String(props.minutesLabel ?? "Min");
		const secondsLabel = String(props.secondsLabel ?? "Sec");

		if (parts.expired) {
			return `<div data-kiv-type="countdown"><time datetime="${escapeHtml(props.targetDate ?? "")}">${escapeHtml(props.expiredMessage ?? "Time's up!")}</time></div>`;
		}

		const gap = style === "inline" ? "6px" : "12px";
		const wrapperStyle = styleToString({
			display: "flex",
			alignItems: "center",
			gap,
		});
		const separator =
			style === "inline" ? '<span style="opacity:0.5;">:</span>' : "";
		const units = [
			unitBoxHtml(
				parts.days,
				daysLabel,
				showLabels,
				style,
				accentColor,
				fontSize,
			),
			unitBoxHtml(
				parts.hours,
				hoursLabel,
				showLabels,
				style,
				accentColor,
				fontSize,
			),
			unitBoxHtml(
				parts.minutes,
				minutesLabel,
				showLabels,
				style,
				accentColor,
				fontSize,
			),
			unitBoxHtml(
				parts.seconds,
				secondsLabel,
				showLabels,
				style,
				accentColor,
				fontSize,
			),
		];
		return `<div style="${wrapperStyle}" data-kiv-type="countdown"><time datetime="${escapeHtml(props.targetDate ?? "")}" style="display:contents;">${units.join(separator)}</time></div>`;
	},
	fields: {
		targetDate: f.text({ label: "Target Date (ISO)", group: "Behavior" }),
		expiredMessage: f.text({
			label: "Expired Message",
			default: "Time's up!",
			localizable: true,
			group: "Behavior",
		}),
		daysLabel: f.text({
			label: "Days Label",
			default: "Days",
			localizable: true,
			group: "Labels",
		}),
		hoursLabel: f.text({
			label: "Hours Label",
			default: "Hours",
			localizable: true,
			group: "Labels",
		}),
		minutesLabel: f.text({
			label: "Minutes Label",
			default: "Min",
			localizable: true,
			group: "Labels",
		}),
		secondsLabel: f.text({
			label: "Seconds Label",
			default: "Sec",
			localizable: true,
			group: "Labels",
		}),
		showLabels: f.boolean({
			label: "Show Unit Labels",
			default: true,
			group: "Style",
		}),
		countdownStyle: f.select(["boxes", "inline", "minimal"], {
			label: "Style",
			default: "boxes",
			group: "Style",
		}),
		size: f.select(["sm", "md", "lg"], {
			label: "Size",
			default: "md",
			responsive: true,
			group: "Style",
		}),
		accentColor: f.color({
			label: "Accent Color",
			default: "#6366f1",
			group: "Style",
		}),
	},
});
