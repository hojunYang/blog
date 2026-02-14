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

	const allTags = $derived(() => {
		const tags = new Set<string>();
		posts.forEach((post) => {
			post.tags.forEach((tag) => tags.add(tag));
		});
		return Array.from(tags).sort();
	});

	const filteredPosts = $derived(() => {
		return posts.filter((post) => {
			const matchesSearch =
				searchQuery === '' ||
				post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesTag = selectedTag === '' || post.tags.includes(selectedTag);

			return matchesSearch && matchesTag;
		});
	});
</script>

<svelte:head>
	<title>블로그 - My post</title>
</svelte:head>

<div class="post-page">
	<!-- <div class="page-header">
		<h1>블로그 포스트</h1>
		<p>개발과 기술에 관한 다양한 이야기</p>
	</div> -->

	<div class="filters">
		<div class="search-box">
			<input
				type="text"
				placeholder="검색..."
				bind:value={searchQuery}
				class="search-input"
			/>
		</div>

		<div class="tags-filter">
			<button
				class="tag-button"
				class:active={selectedTag === ''}
				onclick={() => (selectedTag = '')}
			>
				전체
			</button>
			{#each allTags() as tag}
				<button
					class="tag-button"
					class:active={selectedTag === tag}
					onclick={() => (selectedTag = tag)}
				>
					{tag}
				</button>
			{/each}
		</div>
	</div>

	<div class="posts-section">
		<div class="posts-count">
			{filteredPosts().length}개의 포스트
		</div>

		<div class="posts-grid">
		{#each filteredPosts() as post}
			<PostCard {post} />
		{:else}
			<div class="no-posts">
				<p>검색 결과가 없습니다.</p>
			</div>
		{/each}
		</div>
	</div>
</div>

<style>
	.post-page {
		max-width: var(--post-max-width);
		margin: 0 auto;
	}

	.posts-section {
		animation: fadeIn 0.5s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* .page-header {
		text-align: center;
		margin-bottom: var(--spacing-2xl);
	}

	.page-header h1 {
		font-size: var(--font-4xl);
		margin: 0 0 var(--spacing-sm) 0;
		background: var(--color-primary);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.page-header p {
		font-size: var(--font-lg);
		color: var(--color-text-muted);
		margin: 0;
	} */

	.filters {
		background: var(--color-bg-white);
		padding: var(--spacing-lg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		margin-bottom: var(--spacing-xl);
	}

	.search-box {
		margin-bottom: var(--spacing-md);
	}

	.search-input {
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-md);
		border: 2px solid var(--color-border-light);
		border-radius: var(--radius-md);
		font-size: var(--font-base);
		font-family: var(--font-mono);
		transition: border-color var(--transition-base);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.tags-filter {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.tag-button {
		padding: var(--spacing-sm) var(--spacing-md);
		border: 2px solid var(--color-border-light);
		background: var(--color-bg-white);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-base);
		font-size: var(--font-sm);
		font-weight: 400;
	}

	.tag-button:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.tag-button.active {
		background: var(--color-primary);
		color: white;
		border-color: transparent;
	}

	.posts-count {
		color: var(--color-text-muted);
		margin-bottom: var(--spacing-lg);
		font-size: var(--font-sm);
	}

	.posts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--spacing-xl);
	}

	.no-posts {
		grid-column: 1 / -1;
		text-align: center;
		padding: var(--spacing-2xl);
		background: var(--color-bg-white);
		border-radius: var(--radius-lg);
		color: var(--color-text-muted);
	}

	@media (max-width: 1200px) {

		.filters {
			padding: var(--spacing-md);
		}

		.posts-grid {
			background: transparent;
			gap: var(--spacing-md);
			border-radius: 0;
			padding: 0;
			box-shadow: none;
		}
	}
</style>

