import type {
	MediaAsset,
	MediaProvider,
	StorageProvider,
} from "@kivcode/engine";

/**
 * Minimal StorageProvider backed by localStorage — a stand-in for a real
 * key/value service (Redis, browser storage, etc). Namespaced separately
 * from persistence.ts's own page storage key so the two never collide.
 */
const KV_PREFIX = "kiv:demo:kv:";

export const localStorageService: StorageProvider = {
	get<T>(key: string): T | null {
		try {
			const raw = localStorage.getItem(KV_PREFIX + key);
			return raw ? (JSON.parse(raw) as T) : null;
		} catch {
			return null;
		}
	},
	set<T>(key: string, value: T): void {
		try {
			localStorage.setItem(KV_PREFIX + key, JSON.stringify(value));
		} catch {
			// storage full / unavailable — in a real app, surface this to the user
		}
	},
	remove(key: string): void {
		try {
			localStorage.removeItem(KV_PREFIX + key);
		} catch {
			// ignore
		}
	},
};

function placeholderAsset(
	id: string,
	color: string,
	label: string,
): MediaAsset {
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><rect width='100%' height='100%' fill='${color}'/><text x='50%' y='50%' fill='#fff' font-family='sans-serif' font-size='20' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`;
	return {
		id,
		url: `data:image/svg+xml;base64,${btoa(svg)}`,
		type: "image",
		alt: label,
	};
}

/**
 * In-memory library backing the mock provider's `list()` — stands in for a
 * real media library API. Seeded with a few placeholder assets so the media
 * browser modal has something to show before any upload happens.
 */
const library: MediaAsset[] = [
	placeholderAsset("seed-1", "#6366f1", "Sample 1"),
	placeholderAsset("seed-2", "#10b981", "Sample 2"),
	placeholderAsset("seed-3", "#f59e0b", "Sample 3"),
];

/**
 * Mock MediaProvider — creates a local object URL instead of uploading
 * anywhere, and keeps an in-memory `library` for `list()`. Swap for a real
 * provider (S3, Cloudinary...) in a real app.
 */
export const mockMediaProvider: MediaProvider = {
	async upload(file, opts): Promise<MediaAsset> {
		const asset: MediaAsset = {
			id: `${file.name}-${file.size}-${Date.now()}`,
			url: URL.createObjectURL(file),
			type: file.type.startsWith("video")
				? "video"
				: file.type.startsWith("image")
					? "image"
					: "file",
			alt: file.name,
			meta: { folder: opts?.folder },
		};
		library.unshift(asset);
		return asset;
	},
	resolve(src): string {
		return src;
	},
	async delete(url): Promise<void> {
		const index = library.findIndex((asset) => asset.url === url);
		if (index >= 0) library.splice(index, 1);
	},
	async list(query): Promise<MediaAsset[]> {
		let items = library;
		if (query?.type) {
			items = items.filter((asset) => asset.type === query.type);
		}
		if (query?.search) {
			const q = query.search.toLowerCase();
			items = items.filter(
				(asset) =>
					asset.url.toLowerCase().includes(q) ||
					(asset.alt ?? "").toLowerCase().includes(q),
			);
		}
		return items;
	},
};
