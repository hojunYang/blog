<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const recentPosts = $derived(data.recentPosts);
	
	// 5개 포스트를 5번 반복해서 25개로 만들기
	const extendedPosts = $derived([...recentPosts, ...recentPosts, ...recentPosts, ...recentPosts, ...recentPosts]);

	let rotation = $state(0);
	let isDragging = $state(false);
	let startX = $state(0);
	let currentX = $state(0);
	let velocity = $state(0);

	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		startX = e.clientX;
		currentX = e.clientX;
		velocity = 0;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		
		const deltaX = e.clientX - currentX;
		velocity = deltaX;
		rotation += deltaX * 0.20;
		currentX = e.clientX;
	}

	function handleMouseUp() {
		isDragging = false;
		const interval = setInterval(() => {
			if (Math.abs(velocity) < 0.1) {
				clearInterval(interval);
				velocity = 0;
			} else {
				velocity *= 0.92;
				rotation += velocity * 0.20;
			}
		}, 10) as unknown as number;
	}

	function animate() {
		requestAnimationFrame(animate);
	}

	$effect(() => {
		animate();
	});
</script>

<svelte:head>
	<title>홈 - Hojun Yang</title>
</svelte:head>

<div 
	class="home"
	role="button"
	tabindex="0"
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseUp}
>
	<section class="carousel-section desktop-only">
		<h4>최근 포스트</h4>
		
		<div class="carousel-container">
			{#each extendedPosts as post, i}
				{@const angle = (360 / extendedPosts.length) * i + rotation}
				{@const radius = 1600}
				{@const x = Math.cos((angle * Math.PI) / 180) * radius}
				{@const y = Math.sin((angle * Math.PI) / 180) * radius}
				{@const cardRotation = angle + 90}
				
				<div 
					class="post-wrapper"
					class:dragging={isDragging}
					style="
						transform: translate(calc(-50% + {x}px), calc(-50% + {y}px)) rotate({cardRotation}deg);
					"
				>
					<PostCard {post} />
				</div>
			{/each}
		</div>
	</section>

	<section class="recent-posts mobile-only">
		<h4>최근 포스트</h4>
		<div class="posts-grid">
			{#each recentPosts as post}
				<PostCard {post} />
			{/each}
		</div>
	</section>
</div>

<style>
	.home {
		animation: fadeIn 0.5s ease-in;
		position: relative;
		height: 80vh;
		overflow: hidden;
		cursor: grab;
		user-select: none;
	}

	.home:active {
		cursor: grabbing;
	}

	.desktop-only {
		display: block;
	}

	.mobile-only {
		display: none;
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
	
	.carousel-section {
		position: relative;
		width: 100%;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.carousel-section h4 {
		font-size: var(--font-3xl);
		margin: 0 0 var(--spacing-2xl) 0;
		color: var(--color-text-primary);
		text-align: center;
		position: absolute;
		top: 100px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10;
		pointer-events: none;
	}

	.carousel-container {
		position: relative;
		width: 100%;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.post-wrapper {
		position: absolute;
		width: 320px;
		top: 200%;
		left: 50%;
		pointer-events: auto;
	}

	.post-wrapper.dragging {
		transition: none;
	}

	.recent-posts {
		margin-top: var(--spacing-md);
	}

	.recent-posts h4 {
		font-size: var(--font-xl);
		margin: 0 0 var(--spacing-xl) 0;
		color: var(--color-text-primary);
	}

	.posts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--spacing-xl);
	}

	@media (max-width: 768px) {
		.desktop-only {
			display: none;
		}

		.mobile-only {
			display: block;
		}

		.home {
			cursor: default;
			height: auto;
			overflow: visible;
		}

		.recent-posts h4 {
			font-size: var(--font-2xl);
		}

		.posts-grid {
			grid-template-columns: 1fr;
			gap: var(--spacing-lg);
		}
	}
</style>
