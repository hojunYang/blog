<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const posts = $derived(data.posts);

	let searchQuery = $state('');
	let selectedTag = $state('');
	const normalizedQuery = $derived(searchQuery.trim().toLowerCase());

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
</script>

<svelte:head>
	<title>블로그 - My post</title>
</svelte:head>

<div class="post-page">
	<div class="filters" role="search" aria-label="포스트 필터">
		<div class="filter-field">
			<label for="post-search" class="filter-label">제목 검색</label>
			<input
				id="post-search"
				type="text"
				placeholder="검색어를 입력해 주세요"
				aria-label="포스트 검색"
				bind:value={searchQuery}
				class="search-input"
			/>
		</div>

		<div class="filter-field filter-field-select">
			<label for="post-tag-filter" class="filter-label">태그</label>
			<select id="post-tag-filter" class="tag-select" bind:value={selectedTag} aria-label="태그 필터">
				<option value="">전체</option>
			{#each allTags() as tag}
					<option value={tag}>{tag}</option>
			{/each}
			</select>
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

	.posts-section {
		animation: fadeIn 0.35s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.filters {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 220px;
		gap: var(--spacing-sm);
		align-items: end;
		border: 1px solid var(--control-border, var(--stroke));
		border-radius: 8px;
		background: var(--control-bg, transparent);
		padding: var(--spacing-sm);
		margin-bottom: var(--spacing-xl);
	}

	.filter-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.filter-label {
		font-size: var(--font-xs);
		color: var(--text-muted);
	}

	.search-input,
	.tag-select {
		width: 100%;
		height: 38px;
		padding: 0 var(--spacing-sm);
		border: 1px solid var(--control-border, var(--stroke));
		border-radius: 7px;
		background: var(--control-bg, transparent);
		color: var(--text);
		font-size: var(--font-sm);
		font-family: var(--font-mono);
		transition: border-color var(--transition-fast), opacity var(--transition-fast);
	}

	.search-input::placeholder {
		color: var(--text-muted);
		opacity: 0.88;
	}

	.tag-select {
		appearance: none;
		background-image:
			linear-gradient(45deg, transparent 50%, var(--text-muted) 50%),
			linear-gradient(135deg, var(--text-muted) 50%, transparent 50%);
		background-position:
			calc(100% - 14px) calc(50% - 2px),
			calc(100% - 9px) calc(50% - 2px);
		background-size: 5px 5px, 5px 5px;
		background-repeat: no-repeat;
		padding-right: 28px;
	}

	.search-input:hover,
	.tag-select:hover {
		border-color: rgba(31, 41, 51, 0.2);
	}

	.search-input:focus,
	.tag-select:focus {
		outline: none;
		border-color: var(--link);
	}

	.posts-count {
		color: var(--text-muted);
		margin-bottom: var(--spacing-md);
		font-size: var(--font-xs);
		letter-spacing: 0.01em;
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

		.filters {
			grid-template-columns: 1fr;
			gap: var(--spacing-xs);
			padding: var(--spacing-xs);
		}

		.posts-grid {
			gap: var(--spacing-md);
		}
	}
</style>
