import type { Breakpoint, KivDocument } from "@kivcode/engine";
import { createEngine, renderToHtml } from "@kivcode/engine";
import { ALL_NODES, HOVER_EFFECTS_CSS } from "@kivcode/nodes";
import { ALL_INTERACTIVE_NODES } from "@kivcode/nodes-interactive";
import type { AnalyticsEvent, ClickCounts } from "@kivcode/plugin-analytics";
import { analyticsPlugin, clickCounterPlugin } from "@kivcode/plugin-analytics";
import { createDefaultReactRegistry, KivRenderer } from "@kivcode/react";
import { KivEditor } from "@kivcode/react-editor";
import "@kivcode/react-editor/style";
import { useEffect, useMemo, useRef, useState } from "react";
import { demoDocument } from "./demo-document";
import { clearPage, loadPage, savePage } from "./persistence";
import { localStorageService, mockMediaProvider } from "./services";

// Both the renderer (KivRenderer) and the editor (KivEditor) are exercised
// here — same `engine`, same document, same localStorage key as the Vue
// demo (`kiv:demo:page`), so switching between the two demos mid-edit picks
// up right where the other left off.

// A stable, module-level registry — it holds no state, just a type→component
// map, so there's no reason to recreate it per render or per App instance.
const reactRegistry = createDefaultReactRegistry();

function breakpointForWidth(w: number): Breakpoint {
	if (w >= 1280) return "xl";
	if (w >= 1024) return "lg";
	if (w >= 768) return "md";
	if (w >= 640) return "sm";
	return "base";
}

export function App() {
	const [mode, setMode] = useState<"preview" | "editor">("editor");
	const [doc, setDoc] = useState<KivDocument>(() => loadPage() ?? demoDocument);
	const [previewLocale, setPreviewLocale] = useState(() => doc.i18n.default);
	const [exportBreakpoint, setExportBreakpoint] = useState<Breakpoint>("base");
	const [events, setEvents] = useState<AnalyticsEvent[]>([]);
	const [clickCounts, setClickCounts] = useState<ClickCounts>({});

	// The engine (bus, registry, plugins, media/services) is created once per
	// App instance and never recreated — its plugin callbacks close over the
	// setters above directly, so there's no need for the module-level
	// indirection the Vue demo would need if it weren't using refs.
	const engine = useMemo(
		() =>
			createEngine({
				nodes: [...ALL_NODES, ...ALL_INTERACTIVE_NODES],
				services: { storage: localStorageService },
				media: { provider: mockMediaProvider },
				plugins: [
					// Captures every event via the "*" wildcard.
					analyticsPlugin({
						sink: (e: AnalyticsEvent) =>
							setEvents((prev) => [{ ...e }, ...prev].slice(0, 20)),
					}),
					// Tallies clicks per button (listens only to button.clicked).
					clickCounterPlugin({
						onChange: (counts: ClickCounts) => setClickCounts(counts),
					}),
				],
			}),
		[],
	);

	// ── Responsive preview ──────────────────────────────────────────────────
	// The preview must reflect the ACTUAL width it's rendered at, so
	// responsive props (Grid columns, Column span, sizes…) resolve to the
	// right breakpoint. Without this the preview is stuck at "base" (mobile)
	// regardless of width.
	const [previewBreakpoint, setPreviewBreakpoint] =
		useState<Breakpoint>("base");
	const stageRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const el = stageRef.current;
		if (!el) return;
		const observer = new ResizeObserver((entries) => {
			const w = entries[0]?.contentRect.width ?? el.clientWidth;
			setPreviewBreakpoint(breakpointForWidth(w));
		});
		observer.observe(el);
		setPreviewBreakpoint(breakpointForWidth(el.clientWidth));
		return () => observer.disconnect();
	}, []);

	// Inject theme CSS variables into <head>, once.
	useEffect(() => {
		const styleEl = document.createElement("style");
		styleEl.textContent = engine.css();
		document.head.appendChild(styleEl);
		return () => {
			styleEl.remove();
		};
	}, [engine]);

	function resetToDemo() {
		clearPage();
		setDoc(structuredClone(demoDocument));
	}

	function reloadFromSaved() {
		setDoc(loadPage() ?? demoDocument);
	}

	function clearEvents() {
		setEvents([]);
	}

	function onDocumentChange(next: KivDocument) {
		setDoc(next);
		savePage(next);
	}

	// Export the current document to static HTML via renderToHtml() — each
	// node type's own toHtml() renders itself; unregistered types fall back
	// to a div. Same helper the Vue demo uses (renderToHtml is framework-
	// agnostic, part of @kivcode/engine).
	function exportHtml() {
		const body = renderToHtml(doc, {
			registry: engine.registry,
			locale: previewLocale,
			breakpoint: exportBreakpoint,
		});
		// Nodes render only their OWN inline styles — the theme variables
		// (colors, spacing tokens), the base reset/font-family, and the
		// .kiv-hover-* preset classes (`:hover` can't be inlined) all live in
		// the app's global stylesheet in the live demo. None of them travel
		// with a bare renderToHtml() call, so all three must be inlined here.
		const resetCss =
			"*,*::before,*::after{box-sizing:border-box;}html,body{margin:0;padding:0;}body{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;}img{max-width:100%;}";
		const html = `<!doctype html>\n<html lang="${doc.i18n.default}">\n<head><meta charset="utf-8"><title>Kiv export</title><style>${resetCss}\n${engine.css()}\n${HOVER_EFFECTS_CSS}</style></head>\n<body>${body}</body>\n</html>`;
		const blob = new Blob([html], { type: "text/html" });
		window.open(URL.createObjectURL(blob), "_blank");
	}

	const countList = useMemo(
		() => Object.entries(clickCounts).sort((a, b) => b[1] - a[1]),
		[clickCounts],
	);

	if (mode === "editor") {
		return (
			<div className="demo">
				<div className="demo-bar">
					<div className="demo-bar__brand">Kiv Demo · React editor</div>
					<div className="demo-bar__spacer" />
					<button
						type="button"
						className="demo-reset"
						onClick={() => setMode("preview")}
					>
						Switch to preview
					</button>
				</div>
				<div style={{ flex: "1", minHeight: 0 }}>
					<KivEditor
						document={doc}
						registry={engine.registry}
						reactRegistry={reactRegistry}
						bus={engine.bus}
						engine={engine}
						title="Kiv Demo"
						onDocumentChange={onDocumentChange}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="demo">
			<div className="demo-bar">
				<div className="demo-bar__brand">Kiv Demo · React renderer</div>
				<div className="demo-bar__spacer" />

				<button
					type="button"
					className="demo-reset"
					onClick={() => setMode("editor")}
				>
					Switch to editor
				</button>
				<button type="button" className="demo-reset" onClick={reloadFromSaved}>
					Reload saved page
				</button>
				<select
					value={exportBreakpoint}
					onChange={(e) => setExportBreakpoint(e.target.value as Breakpoint)}
					className="demo-export-bp"
					title="Export HTML is a single static snapshot (for email / PDF / SEO) — pick which breakpoint it renders at"
				>
					<option value="base">Export @ base (mobile)</option>
					<option value="sm">Export @ sm</option>
					<option value="md">Export @ md</option>
					<option value="lg">Export @ lg</option>
					<option value="xl">Export @ xl (desktop)</option>
				</select>
				<button type="button" className="demo-reset" onClick={exportHtml}>
					Export HTML
				</button>
				<button type="button" className="demo-reset" onClick={resetToDemo}>
					Reset
				</button>

				<div className="demo-bar__locales">
					{doc.i18n.supported.map((loc) => (
						<button
							key={loc}
							type="button"
							className={previewLocale === loc ? "active" : undefined}
							onClick={() => setPreviewLocale(loc)}
						>
							{loc.toUpperCase()}
						</button>
					))}
				</div>
			</div>

			<div className="demo-preview">
				<div ref={stageRef} className="demo-preview__stage">
					<KivRenderer
						document={doc}
						registry={reactRegistry}
						locale={previewLocale}
						breakpoint={previewBreakpoint}
						bus={engine.bus}
						media={engine.media}
						services={engine.services}
					/>
				</div>

				{/* Two plugins listening on the same bus — proves the flow works
				    identically to the Vue renderer, since @kivcode/engine's bus/plugin
				    system is entirely framework-agnostic. */}
				<aside className="demo-events">
					<div className="demo-events__header">
						<span>Plugins</span>
						<button type="button" onClick={clearEvents}>
							Clear log
						</button>
					</div>
					<p className="demo-events__hint">
						Click a button in the preview → two independent plugins react via
						the engine bus, without touching the renderer.
					</p>

					<div className="demo-panel">
						<div className="demo-panel__title">
							<span className="demo-panel__dot demo-panel__dot--count" />
							click-counter · listens to <code>button.clicked</code>
						</div>
						<ul className="demo-counts">
							{countList.length === 0 && (
								<li className="demo-events__empty">No clicks yet.</li>
							)}
							{countList.map(([key, n]) => (
								<li key={key} className="demo-counts__item">
									<span className="demo-counts__key">{key}</span>
									<span className="demo-counts__badge">{n}</span>
								</li>
							))}
						</ul>
					</div>

					<div className="demo-panel">
						<div className="demo-panel__title">
							<span className="demo-panel__dot demo-panel__dot--events" />
							analytics · listens to <code>*</code>
						</div>
						<ul className="demo-events__list">
							{events.length === 0 && (
								<li className="demo-events__empty">No events yet.</li>
							)}
							{events.map((e, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: this is a bounded, prepend-only log — index is stable enough for a demo
								<li key={i} className="demo-events__item">
									<span className="demo-events__name">{e.event}</span>
									<code className="demo-events__payload">
										{JSON.stringify(e.payload)}
									</code>
								</li>
							))}
						</ul>
					</div>
				</aside>
			</div>
		</div>
	);
}
