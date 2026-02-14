<script lang="ts">
	import type { BlogPost } from '$lib/types';

	interface Props {
		post: Omit<BlogPost, 'content'>;
	}

	let { post }: Props = $props();
</script>

<article class="post-card">
	<a href={`/post/${post.id}`} class="post-link">
		<div class="post-header">
			<h2>{post.title}</h2>
		</div>
		<p class="excerpt">{post.excerpt}</p>
		<div class="tags">
			{#each post.tags as tag}
				<span class="tag">{tag}</span>
			{/each}
		</div>
	</a>
</article>

<style>
	.post-card {
		background: var(--card-bg);
		border-radius: 8px;
		padding: var(--spacing-lg);
		border: 1px solid transparent;
		transition: transform 0.16s ease, background 0.16s ease;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.post-card:hover {
		transform: translateY(-2px) scale(1.01);
		background: rgba(79, 131, 255, 0.04);
	}

	.post-link {
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		height: 100%;
		gap: var(--spacing-sm);
	}

	.post-header {
		margin-bottom: var(--spacing-md);
	}

	h2 {
		margin: 0;
		color: var(--text);
		font-size: var(--font-xl);
		line-height: 1.3;
	}

	.excerpt {
		color: var(--text-muted);
		line-height: 1.5;
		margin: 0;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		flex: 1;
	}

	.tag {
		border: none;
		color: var(--text-muted);
		padding: 2px 0;
		border-radius: 999px;
		font-size: var(--font-xxs);
		font-weight: 600;
		background: transparent;
	}

	@media (max-width: 1200px) {
		.post-card {
			padding: var(--spacing-md);
			border-radius: 8px;
			box-shadow: none;
			border: 1px solid transparent;
		}

		.post-card:hover {
			transform: translateY(-2px) scale(1.01);
			box-shadow: var(--shadow-soft);
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
		}

			.excerpt {
				font-size: var(--font-sm);
				margin-bottom: 0;
				display: -webkit-box;
				-webkit-line-clamp: 2;
			line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
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

		.tags {
			gap: var(--spacing-xs);
		}
	}
</style>
