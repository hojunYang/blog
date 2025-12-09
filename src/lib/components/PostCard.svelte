<script lang="ts">
	import type { BlogPost } from '$lib/types';

	interface Props {
		post: Omit<BlogPost, 'content'>;
	}

	let { post }: Props = $props();

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<article class="post-card">
	<a href="/post/{post.id}" class="post-link">
		<div class="post-header">
			<h2>{post.title}</h2>
			<div class="post-meta">
				<span class="date">{formatDate(post.date)}</span>
			</div>
		</div>
		<p class="excerpt">{post.excerpt}</p>
		<div class="tags">
			{#each post.tags as tag}
				<span class="tag">{tag}</span>
			{/each}
		</div>
		<div class="read-more">
			더 읽기 →
		</div>
	</a>
</article>

<style>
	.post-card {
		background: var(--color-bg-white);
		border-radius: var(--radius-lg);
		padding: var(--spacing-xl);
		box-shadow: var(--shadow-md);
		transition: all var(--transition-base);
		aspect-ratio: 3 / 3.5;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.post-card:hover {
		transform: translateY(-5px);
		box-shadow: var(--shadow-lg);
	}

	.post-link {
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.post-header {
		margin-bottom: var(--spacing-md);
	}

	h2 {
		margin: 0 0 var(--spacing-sm) 0;
		color: var(--color-text-primary);
		font-size: var(--font-2xl);
		line-height: 1.3;
	}

	.post-meta {
		display: flex;
		gap: var(--spacing-md);
		flex-wrap: wrap;
		font-size: var(--font-sm);
		color: var(--color-text-muted);
	}

	.author,
	.date {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.excerpt {
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0 0 var(--spacing-md) 0;
		flex-grow: 1;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
	}

	.tag {
		background: var(--color-bg-gray);
		color: var(--color-text-secondary);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-full);
		font-size: var(--font-xxs);
		font-weight: 600;
	}

	.read-more {
		color: var(--color-text-primary);
		font-weight: 600;
		margin-top: auto;
	}

	.post-card:hover .read-more {
		color: var(--color-text-hover);
	}

	@media (max-width: 1080px) {
		.post-card {
			background: transparent;
			border-radius: 0;
			padding: var(--spacing-lg) 0;
			box-shadow: none;
			aspect-ratio: auto;
			border-bottom: 1px solid var(--color-border-light);
			transition: background-color var(--transition-fast);
		}

		.post-card:last-child {
			border-bottom: none;
		}

		.post-card:hover {
			transform: none;
			box-shadow: none;
			background-color: rgba(0, 0, 0, 0.02);
		}

		.post-link {
			height: auto;
		}

		.post-header {
			margin-bottom: var(--spacing-sm);
		}

		h2 {
			font-size: var(--font-lg);
			margin-bottom: var(--spacing-xs);
		}

		.post-meta {
			font-size: var(--font-xs);
			gap: var(--spacing-sm);
		}

		.author {
			display: none;
		}

		.excerpt {
			font-size: var(--font-sm);
			margin-bottom: var(--spacing-sm);
			display: -webkit-box;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
			flex-grow: 0;
		}

		.tags {
			margin-bottom: 0;
			gap: var(--spacing-xs);
		}

		.tag {
			font-size: var(--font-xxs);
			padding: var(--spacing-xs) var(--spacing-sm);
		}

		.read-more {
			display: none;
		}

		.date {
			font-size: var(--font-xs);
		}
	}
</style>

