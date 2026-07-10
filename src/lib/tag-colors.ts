const TAG_PALETTE = [
	'#2563eb',
	'#0f9f8f',
	'#d97706',
	'#7c3aed',
	'#e11d48',
	'#0891b2',
	'#65a30d',
	'#c2410c',
	'#4f46e5',
	'#be123c'
];

const UNTAGGED_TAG_COLOR = '#64748b';

export function normalizeTagKey(tag: string): string {
	return tag.trim().normalize('NFC').toLowerCase();
}

function hashTag(tag: string): number {
	let hash = 2166136261;
	for (let index = 0; index < tag.length; index += 1) {
		hash ^= tag.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

export function getTagColor(tag: string | null): string {
	if (!tag) return UNTAGGED_TAG_COLOR;

	return TAG_PALETTE[hashTag(normalizeTagKey(tag)) % TAG_PALETTE.length];
}
