<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const post = $derived(data.post);

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{post ? post.title : '포스트를 찾을 수 없습니다'} - My Blog</title>
</svelte:head>

<div class="post-page">
	{#if post}
		<article class="post">
			<header class="post-header">
				<a href="/post" class="back-link">← 목록으로 돌아가기</a>
				<h1>{post.title}</h1>
				<div class="post-meta">
					<span class="author">👤 {post.author}</span>
					<span class="date">📅 {formatDate(post.date)}</span>
				</div>
				<div class="tags">
					{#each post.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</header>

			<div class="post-content">
				{@html post.content}
			</div>
		</article>
	{:else}
		<div class="not-found">
			<h1>포스트를 찾을 수 없습니다</h1>
			<p>요청하신 포스트가 존재하지 않습니다.</p>
			<a href="/blog" class="back-button">블로그 목록으로</a>
		</div>
	{/if}
</div>

<style>
	.post-page {
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

	.post {
		background: var(--color-bg-white);
		border-radius: var(--radius-lg);
		padding: var(--spacing-2xl);
		box-shadow: var(--shadow-md);
		max-width: 800px;
		margin: 0 auto;
	}

	.post-header {
		margin-bottom: var(--spacing-2xl);
		padding-bottom: var(--spacing-xl);
		border-bottom: 2px solid var(--color-border-light);
	}

	.back-link {
		display: inline-block;
		color: var(--color-primary);
		text-decoration: none;
		margin-bottom: var(--spacing-lg);
		font-weight: 500;
		transition: color var(--transition-base);
	}

	.back-link:hover {
		color: var(--color-secondary);
	}

	.post-header h1 {
		font-size: var(--font-4xl);
		margin: 0 0 var(--spacing-md) 0;
		color: var(--color-text-primary);
		line-height: 1.2;
	}

	.post-meta {
		display: flex;
		gap: var(--spacing-lg);
		flex-wrap: wrap;
		margin-bottom: var(--spacing-md);
		color: var(--color-text-muted);
	}

	.author,
	.date {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.tag {
		background: var(--color-gradient);
		color: white;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-full);
		font-size: var(--font-sm);
		font-weight: 500;
	}

	.post-content {
		color: var(--color-text-primary);
		line-height: 1.8;
	}

	.post-content :global(h1) {
		font-size: var(--font-3xl);
		margin: var(--spacing-xl) 0 var(--spacing-md) 0;
		color: var(--color-text-primary);
	}

	.post-content :global(h2) {
		font-size: var(--font-2xl);
		margin: var(--spacing-lg) 0 var(--spacing-md) 0;
		color: var(--color-text-primary);
	}

	.post-content :global(h3) {
		font-size: var(--font-xl);
		margin: var(--spacing-lg) 0 var(--spacing-md) 0;
		color: var(--color-text-primary);
	}

	.post-content :global(p) {
		margin: var(--spacing-md) 0;
	}

	.post-content :global(code) {
		background: var(--color-bg-light);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
		font-size: 0.9em;
		color: #e53e3e;
	}

	.post-content :global(pre) {
		background: var(--color-text-primary);
		color: #e2e8f0;
		padding: var(--spacing-lg);
		border-radius: var(--radius-md);
		overflow-x: auto;
		margin: var(--spacing-lg) 0;
	}

	.post-content :global(pre code) {
		background: none;
		padding: 0;
		color: inherit;
		font-size: var(--font-sm);
		line-height: 1.5;
	}

	.post-content :global(strong) {
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.post-content :global(ol),
	.post-content :global(ul) {
		margin: var(--spacing-md) 0;
		padding-left: var(--spacing-xl);
	}

	.post-content :global(li) {
		margin: var(--spacing-sm) 0;
		line-height: 1.6;
	}

	.post-content :global(ol) {
		list-style-type: decimal;
	}

	.post-content :global(ul) {
		list-style-type: disc;
	}

	.not-found {
		text-align: center;
		padding: var(--spacing-3xl) var(--spacing-xl);
		background: var(--color-bg-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
	}

	.not-found h1 {
		font-size: var(--font-3xl);
		margin: 0 0 var(--spacing-md) 0;
		color: var(--color-text-primary);
	}

	.not-found p {
		color: var(--color-text-muted);
		margin: 0 0 var(--spacing-xl) 0;
	}

	.back-button {
		display: inline-block;
		background: var(--color-gradient);
		color: white;
		padding: var(--spacing-sm) var(--spacing-lg);
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 600;
		transition: all var(--transition-base);
	}

	.back-button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-primary);
	}

	@media (max-width: 768px) {
		.post {
			padding: var(--spacing-lg);
		}

		.post-header h1 {
			font-size: var(--font-2xl);
		}

		.post-content :global(h1) {
			font-size: var(--font-2xl);
		}

		.post-content :global(h2) {
			font-size: var(--font-xl);
		}

		.post-content :global(h3) {
			font-size: var(--font-lg);
		}

		.post-content :global(pre) {
			padding: var(--spacing-md);
			font-size: var(--font-xs);
		}
	}
</style>

