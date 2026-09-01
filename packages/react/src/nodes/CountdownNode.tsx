import { computeCountdownParts } from "@kivcode/nodes";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { KivNodeComponentProps } from "../node-props";

const SIZE_PX: Record<string, string> = { sm: "18px", md: "28px", lg: "40px" };

function pad(value: number): string {
	return String(value).padStart(2, "0");
}

export interface CountdownNodeProps extends KivNodeComponentProps {
	targetDate?: string;
	expiredMessage?: string;
	daysLabel?: string;
	hoursLabel?: string;
	minutesLabel?: string;
	secondsLabel?: string;
	showLabels?: boolean;
	countdownStyle?: string;
	size?: string;
	accentColor?: string;
}

export function CountdownNode({
	targetDate,
	expiredMessage,
	daysLabel,
	hoursLabel,
	minutesLabel,
	secondsLabel,
	showLabels = true,
	countdownStyle,
	size,
	accentColor,
	id,
	style,
	...rest
}: CountdownNodeProps) {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const timer = setInterval(() => {
			setNow(Date.now());
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	const parts = useMemo(
		() => computeCountdownParts(targetDate, now),
		[targetDate, now],
	);

	const fontSize = SIZE_PX[size ?? "md"] ?? "28px";
	const displayStyle = countdownStyle ?? "boxes";

	const units = [
		{ value: parts.days, label: daysLabel ?? "Days" },
		{ value: parts.hours, label: hoursLabel ?? "Hours" },
		{ value: parts.minutes, label: minutesLabel ?? "Min" },
		{ value: parts.seconds, label: secondsLabel ?? "Sec" },
	];

	if (parts.expired) {
		return (
			<div id={id} style={style} data-kiv-type="countdown" {...rest}>
				<time dateTime={targetDate ?? ""}>
					{expiredMessage ?? "Time's up!"}
				</time>
			</div>
		);
	}

	return (
		<div id={id} style={style} data-kiv-type="countdown" {...rest}>
			<time dateTime={targetDate ?? ""} style={{ display: "contents" }}>
				<div
					className="kiv-countdown"
					style={{
						display: "flex",
						alignItems: "center",
						gap: displayStyle === "inline" ? "6px" : "12px",
					}}
				>
					{units.map((unit, i) => (
						<Fragment key={unit.label}>
							<div
								className={`kiv-countdown__unit${displayStyle === "boxes" ? " kiv-countdown__unit--boxes" : ""}`}
								style={
									displayStyle === "boxes"
										? {
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
												padding: "12px 16px",
												borderRadius: "8px",
												background: "rgba(99, 102, 241, 0.08)",
												minWidth: "64px",
											}
										: {
												display: "flex",
												flexDirection: "column",
												alignItems: "center",
											}
								}
							>
								<span
									className="kiv-countdown__value"
									style={{
										fontSize,
										fontWeight: 700,
										lineHeight: "1",
										color:
											displayStyle === "minimal"
												? "inherit"
												: (accentColor ?? "#6366f1"),
									}}
								>
									{pad(unit.value)}
								</span>
								{showLabels && (
									<span
										className="kiv-countdown__label"
										style={{
											fontSize: "11px",
											textTransform: "uppercase",
											letterSpacing: "0.05em",
											color: "#64748b",
										}}
									>
										{unit.label}
									</span>
								)}
							</div>
							{displayStyle === "inline" && i < units.length - 1 && (
								<span className="kiv-countdown__sep" style={{ opacity: 0.5 }}>
									:
								</span>
							)}
						</Fragment>
					))}
				</div>
			</time>
		</div>
	);
}
