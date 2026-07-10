<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte';
	import { getTagColor } from '$lib/tag-colors';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const posts = $derived(data.posts);

	let searchQuery = $state('');
	let selectedTag = $state('');
	const normalizedQuery = $derived(searchQuery.trim().toLowerCase());
	const hasActiveFilters = $derived(normalizedQuery !== '' || selectedTag !== '');

	const allTags = $derived(() => {
		const tags = new Set<string>();
		posts.forEach((post) => {
			post.tags.forEach((tag) => tags.add(tag));
		});
		return Array.from(tags).sort((a, b) => a.localeCompare(b, 'ko'));
	});

	const filteredPosts = $derived(() => {
		return posts.filter((post) => {
			const matchesSearch =
				normalizedQuery === '' ||
				post.title.toLowerCase().includes(normalizedQuery) ||
				post.excerpt.toLowerCase().includes(normalizedQuery);

			const matchesTag = selectedTag === '' || post.tags.includes(selectedTag);

			return matchesSearch && matchesTag;
		});
	});

	function resetFilters(): void {
		searchQuery = '';
		selectedTag = '';
	}

	function selectTag(tag: string): void {
		selectedTag = tag;
	}
</script>

<svelte:head>
	<title>블로그 - My post</title>
</svelte:head>

<div class="post-page">
	<div class="filters" role="search" aria-label="포스트 필터">
		<div class="filter-field filter-field-search">
			<label for="post-search" class="filter-label">포스트 검색</label>
			<input
				id="post-search"
				type="text"
				placeholder="제목과 내용을 검색하세요"
				aria-label="포스트 검색"
				bind:value={searchQuery}
				class="search-input"
			/>
		</div>

		<div class="filter-field filter-tags">
			<span id="post-tag-filter-label" class="filter-label">태그</span>
			<div class="tag-controls">
				<div class="tag-filter-list" role="group" aria-labelledby="post-tag-filter-label">
					<button
						type="button"
						class="tag-filter-button"
						class:active={selectedTag === ''}
						aria-pressed={selectedTag === ''}
						onclick={() => selectTag('')}
					>
						전체
					</button>

					{#each allTags() as tag}
						<button
							type="button"
							class="tag-filter-button"
							class:active={selectedTag === tag}
							aria-pressed={selectedTag === tag}
							style={`--tag-color: ${getTagColor(tag)}`}
							onclick={() => selectTag(tag)}
						>
							<span class="tag-dot" aria-hidden="true"></span>
							{tag}
						</button>
					{/each}
				</div>

				{#if hasActiveFilters}
					<button type="button" class="filter-reset" onclick={resetFilters}>초기화</button>
				{/if}
			</div>
		</div>
	</div>

	<div class="posts-section">
		<div class="posts-count" aria-live="polite">
			{filteredPosts().length}개의 포스트
		</div>

		{#if filteredPosts().length > 0}
			<div class="posts-grid">
				{#each filteredPosts() as post}
					<PostCard {post} />
				{/each}
			</div>
		{:else}
			<p class="no-posts" aria-live="polite">검색 결과가 없습니다.</p>
		{/if}
	</div>
</div>

<style>
	.post-page {
		max-width: var(--post-max-width);
		margin: 0 auto;
		padding: 0 var(--spacing-xl);
	}

	.filters {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--spacing-xl);
		align-items: end;
		border-bottom: 1px solid var(--stroke);
		padding-bottom: var(--spacing-lg);
		margin-bottom: var(--spacing-lg);
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}

	.filter-field-search {
		min-width: 0;
	}

	.filter-tags {
		min-width: 0;
	}

	.filter-label {
		font-size: var(--font-xs);
		font-weight: 600;
		line-height: 1;
		color: var(--text-muted);
	}

	.search-input,
	.tag-filter-button {
		width: 100%;
		font-family: inherit;
	}

	.search-input {
		height: 42px;
		padding: 0 13px;
		border: 1px solid rgba(15, 23, 42, 0.11);
		border-radius: 6px;
		background: var(--bg);
		color: var(--text);
		font-size: var(--font-sm);
		transition:
			border-color var(--transition-fast),
			box-shadow var(--transition-fast),
			background-color var(--transition-fast),
			transform var(--duration-press) var(--ease-out);
	}

	.search-input::placeholder {
		color: var(--text-muted);
		opacity: 0.88;
	}

	.tag-controls,
	.tag-filter-list {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
	}

	.tag-controls {
		gap: var(--spacing-sm);
	}

	.tag-filter-list {
		gap: 6px;
	}

	.tag-filter-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		width: auto;
		height: 34px;
		padding: 0 10px;
		border: 1px solid rgba(15, 23, 42, 0.1);
		border-radius: 6px;
		background: transparent;
		color: var(--text-muted);
		font-size: var(--font-xs);
		font-weight: 600;
		line-height: 1;
		cursor: pointer;
		transition:
			transform var(--duration-press) var(--ease-out),
			border-color var(--transition-fast),
			background-color var(--transition-fast),
			color var(--transition-fast);
	}

	.tag-filter-button.active {
		border-color: var(--text);
		background: var(--text);
		color: var(--bg);
	}

	.tag-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--tag-color);
		flex: 0 0 auto;
	}

	.tag-filter-button.active .tag-dot {
		background: currentColor;
	}

	.search-input:focus-visible {
		outline: none;
		border-color: var(--link);
		box-shadow: 0 0 0 3px rgba(79, 131, 255, 0.13);
	}

	.filter-reset {
		height: 34px;
		padding: 0 2px;
		border: 0;
		background: transparent;
		color: var(--text-muted);
		font-size: var(--font-xs);
		font-weight: 600;
		cursor: pointer;
		transition:
			transform var(--duration-press) var(--ease-out),
			color var(--transition-fast);
	}

	@media (hover: hover) and (pointer: fine) {
		.search-input:hover,
		.tag-filter-button:hover {
			border-color: rgba(15, 23, 42, 0.18);
		}

		.tag-filter-button:hover:not(.active) {
			background: var(--bg-muted);
			color: var(--text);
		}

		.filter-reset:hover {
			color: var(--text);
		}
	}

	.posts-count {
		color: var(--text-muted);
		margin-bottom: var(--spacing-md);
		font-size: var(--font-xs);
	}

	.posts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--spacing-lg);
	}

	.no-posts {
		margin: 0;
		font-size: 13px;
		color: var(--text-muted);
	}

	@media (max-width: 1200px) {
		.post-page {
			padding: 0 var(--spacing-md);
		}

		.posts-grid {
			gap: var(--spacing-md);
		}
	}

	@media (max-width: 760px) {
		.filters {
			grid-template-columns: 1fr;
			gap: var(--spacing-md);
		}
	}

	@media (max-width: 560px) {
		.filters {
			gap: 10px;
		}

		.tag-controls {
			align-items: flex-start;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.search-input,
		.tag-filter-button,
		.filter-reset {
			transition: none;
		}
	}
</style>
