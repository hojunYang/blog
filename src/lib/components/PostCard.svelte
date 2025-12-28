<script lang="ts">
	import type { BlogPost } from '$lib/types';

	interface Props {
		post: Omit<BlogPost, 'content'>;
	}

	let { post }: Props = $props();
</script>

<article class="post-card">
	<a href="/post/{post.id}" class="post-link">
		<div class="post-header">
			<h2>{post.title}</h2>
		</div>
		<p class="excerpt">{post.excerpt}</p>
		<div class="bottom-section">
			<div class="tags">
				{#each post.tags as tag}
					<span class="tag">{tag}</span>
				{/each}
			</div>
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

	.excerpt {
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0 0 var(--spacing-md) 0;
		flex-grow: 1;
	}

	.bottom-section {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-md);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		flex: 1;
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

	@media (max-width: 1200px) {
		.post-card {
			background: var(--color-bg-white);
			border-radius: var(--radius-md);
			padding: var(--spacing-md);
			box-shadow: var(--shadow-md);
			aspect-ratio: auto;
			border: none;
			transition: all var(--transition-fast);
			display: flex;
			flex-direction: column;
		}

		.post-card:hover {
			transform: translateY(-5px);
			box-shadow: var(--shadow-lg);
		}

		.post-link {
			height: 100%;
			display: flex;
			flex-direction: column;
		}

		.post-header {
			margin-bottom: var(--spacing-sm);
			flex-shrink: 0;
		}

		h2 {
			font-size: var(--font-lg);
			margin-bottom: 0;
		}

		.excerpt {
			font-size: var(--font-sm);
			margin-bottom: var(--spacing-sm);
			display: -webkit-box;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
			flex-shrink: 0;
		}

		.bottom-section {
			display: flex;
			justify-content: flex-start;
			align-items: flex-start;
			margin-top: auto;
			margin-bottom: 0;
			gap: var(--spacing-md);
		}

		.tags {
			margin-bottom: 0;
			gap: var(--spacing-xs);
			flex: 1;
		}

		.tag {
			font-size: var(--font-xxs);
			padding: var(--spacing-xs) var(--spacing-sm);
		}

		.read-more {
			display: none;
		}
	}
</style>

