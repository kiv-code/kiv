import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { KIV_BUS_KEY } from "../bus";
import ModalNode from "./ModalNode.vue";

function mountModal(props: Record<string, unknown> = {}, bus?: unknown) {
	return mount(ModalNode, {
		props: { triggerLabel: "Open dialog", ...props },
		slots: { default: () => "Modal body" },
		attachTo: document.body,
		global: {
			provide: bus ? { [KIV_BUS_KEY as unknown as string]: bus } : {},
		},
	});
}

describe("ModalNode", () => {
	it("renders the trigger and no dialog until opened", () => {
		const wrapper = mountModal();
		expect(wrapper.html()).toContain("Open dialog");
		expect(document.querySelector('[data-kiv-type="modal"]')).toBeNull();
	});

	it("opens the dialog on trigger click and emits modal.opened", async () => {
		const emit = vi.fn();
		const wrapper = mountModal({}, { emit });
		await wrapper.find("[data-kiv-modal-trigger]").trigger("click");
		expect(document.querySelector('[data-kiv-type="modal"]')).not.toBeNull();
		expect(emit).toHaveBeenCalledWith("modal.opened", { nodeId: undefined });
		wrapper.unmount();
	});

	it("closes on overlay click when closeOnOverlay is true, and emits modal.closed", async () => {
		const emit = vi.fn();
		const wrapper = mountModal({ closeOnOverlay: true }, { emit });
		await wrapper.find("[data-kiv-modal-trigger]").trigger("click");
		const backdrop = document.querySelector(
			".kiv-modal__backdrop",
		) as HTMLElement;
		backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		await wrapper.vm.$nextTick();
		expect(emit).toHaveBeenCalledWith("modal.closed", { nodeId: undefined });
		wrapper.unmount();
	});

	it("closes on Escape when closeOnEscape is true", async () => {
		const wrapper = mountModal({ closeOnEscape: true });
		await wrapper.find("[data-kiv-modal-trigger]").trigger("click");
		const backdrop = document.querySelector(
			".kiv-modal__backdrop",
		) as HTMLElement;
		backdrop.dispatchEvent(
			new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
		);
		await wrapper.vm.$nextTick();
		expect(document.querySelector('[data-kiv-type="modal"]')).toBeNull();
		wrapper.unmount();
	});

	it("shows a close button unless showCloseButton is false", async () => {
		const wrapper = mountModal({ showCloseButton: false });
		await wrapper.find("[data-kiv-modal-trigger]").trigger("click");
		expect(document.querySelector(".kiv-modal__close")).toBeNull();
		wrapper.unmount();
	});
});
