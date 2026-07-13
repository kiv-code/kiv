import type { KivDocument, MediaAsset, MediaProvider } from "@kivcode/engine";
import { createRegistry } from "@kivcode/engine";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { EDITOR_STORE_KEY } from "../../store/context";
import { useEditorStore } from "../../store/editor-store";
import MediaPicker from "./MediaPicker.vue";

const registry = createRegistry();

function makeDoc(): KivDocument {
	return {
		schemaVersion: 1,
		root: { id: "root", type: "page", props: {}, slots: { default: [] } },
		i18n: { default: "en", supported: ["en"] },
	};
}

function makeMedia(assets: MediaAsset[] = []): MediaProvider {
	return {
		async upload(file): Promise<MediaAsset> {
			return { id: file.name, url: `blob:${file.name}`, type: "image" };
		},
		resolve(src): string {
			return src;
		},
		async delete(): Promise<void> {},
		async list(): Promise<MediaAsset[]> {
			return assets;
		},
	};
}

function mountPicker(media: MediaProvider | null) {
	const store = useEditorStore(makeDoc(), registry, { media });
	const wrapper = mount(MediaPicker, {
		props: { modelValue: "" },
		global: { provide: { [EDITOR_STORE_KEY]: store } },
		attachTo: document.body,
	});
	return wrapper;
}

afterEach(() => {
	document.body.innerHTML = "";
});

describe("MediaPicker", () => {
	it("disables Browse Media and shows a hint when no MediaProvider is configured", () => {
		const wrapper = mountPicker(null);
		const browseBtn = wrapper.find(".kiv-media-picker__browse");
		expect(browseBtn.attributes("disabled")).toBeDefined();
		expect(wrapper.text()).toContain("No media provider configured");
	});

	it("emits update:modelValue when the URL input changes", async () => {
		const wrapper = mountPicker(null);
		await wrapper
			.find(".kiv-media-picker__input")
			.setValue("https://example.com/pic.jpg");
		expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([
			"https://example.com/pic.jpg",
		]);
	});

	it("opens the media browser modal and selecting an asset sets the URL", async () => {
		const asset: MediaAsset = {
			id: "a1",
			url: "https://example.com/a1.png",
			type: "image",
			alt: "A1",
		};
		const wrapper = mountPicker(makeMedia([asset]));

		await wrapper.find(".kiv-media-picker__browse").trigger("click");
		await flushPromises();

		const card = document.body.querySelector(".kiv-media-modal__card");
		expect(card).not.toBeNull();
		(card as HTMLElement).click();
		await flushPromises();

		expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([asset.url]);
		expect(document.body.querySelector(".kiv-media-modal")).toBeNull();
	});

	it("clears the value when the clear button is clicked", async () => {
		const wrapper = mount(MediaPicker, {
			props: { modelValue: "https://example.com/pic.jpg" },
			global: {
				provide: {
					[EDITOR_STORE_KEY]: useEditorStore(makeDoc(), registry, {
						media: null,
					}),
				},
			},
			attachTo: document.body,
		});
		await wrapper.find(".kiv-media-picker__clear").trigger("click");
		expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([""]);
	});
});
