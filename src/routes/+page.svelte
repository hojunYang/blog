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
	let touchStartY = $state(0);
	let hasMoved = $state(false);
	let windowHeight = $state(1000); // 기본값
	
	const topPercent = $derived(0.000375 * windowHeight * windowHeight - 0.925 * windowHeight + 750);

	function handleStart(x: number, y?: number) {
		isDragging = true;
		startX = x;
		currentX = x;
		velocity = 0;
		hasMoved = false;
		if (y !== undefined) {
			touchStartY = y;
		}
	}

	function handleMove(x: number, y?: number) {
		if (!isDragging) return;
		
		const deltaX = x - currentX;
		const deltaY = y !== undefined ? Math.abs(y - touchStartY) : 0;
		
		// 수직 이동이 크면 링크 클릭으로 간주
		if (deltaY > 10) {
			hasMoved = true;
		}
		
		// 수평 이동이 있으면 드래그로 간주
		if (Math.abs(deltaX) > 5) {
			hasMoved = true;
			velocity = deltaX;
			rotation += deltaX * 0.20;
		}
		
		currentX = x;
	}

	function handleEnd(e?: Event) {
		// 링크 클릭인 경우 드래그 방지
		if (hasMoved && e) {
			const target = e.target as HTMLElement;
			if (target.closest('a')) {
				// 링크 클릭은 허용
				isDragging = false;
				hasMoved = false;
				return;
			}
		}
		
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
		hasMoved = false;
	}

	function handleMouseDown(e: MouseEvent) {
		// 링크 클릭은 허용
		const target = e.target as HTMLElement;
		if (target.closest('a')) {
			return;
		}
		e.preventDefault();
		handleStart(e.clientX);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		e.preventDefault();
		handleMove(e.clientX);
	}

	function handleMouseUp(e: MouseEvent) {
		handleEnd(e);
	}

	// 터치 이벤트를 non-passive로 등록하기 위한 액션
	function setupTouchListeners(node: HTMLDivElement) {
		const touchStartHandler = (e: TouchEvent) => {
			if (e.touches.length === 1) {
				const target = e.target as HTMLElement;
				// 링크 클릭은 허용
				if (target.closest('a')) {
					return;
				}
				e.preventDefault();
				handleStart(e.touches[0].clientX, e.touches[0].clientY);
			}
		};

		const touchMoveHandler = (e: TouchEvent) => {
			if (!isDragging || e.touches.length !== 1) return;
			e.preventDefault();
			handleMove(e.touches[0].clientX, e.touches[0].clientY);
		};

		const touchEndHandler = (e: TouchEvent) => {
			handleEnd(e);
		};

		node.addEventListener('touchstart', touchStartHandler, { passive: false });
		node.addEventListener('touchmove', touchMoveHandler, { passive: false });
		node.addEventListener('touchend', touchEndHandler, { passive: false });
		node.addEventListener('touchcancel', touchEndHandler, { passive: false });

		return {
			destroy() {
				node.removeEventListener('touchstart', touchStartHandler);
				node.removeEventListener('touchmove', touchMoveHandler);
				node.removeEventListener('touchend', touchEndHandler);
				node.removeEventListener('touchcancel', touchEndHandler);
			}
		};
	}

	function animate() {
		requestAnimationFrame(animate);
	}

	$effect(() => {
		animate();
	});

	// window height를 추적하기 위한 resize 리스너
	$effect(() => {
		if (typeof window === 'undefined') return;
		
		function handleResize() {
			windowHeight = window.innerHeight;
		}
		
		// 초기값 설정
		handleResize();
		
		// resize 이벤트 리스너 추가
		window.addEventListener('resize', handleResize);
		
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
</script>

<svelte:head>
	<title>홈 - Hojun Yang</title>
</svelte:head>

<div 
	class="home"
	role="button"
	tabindex="0"
	use:setupTouchListeners
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
				{@const radius = 1550}
				{@const x = Math.cos((angle * Math.PI) / 180) * radius}
				{@const y = Math.sin((angle * Math.PI) / 180) * radius}
				{@const cardRotation = angle + 90}
				
				<div 
					class="post-wrapper"
					class:dragging={isDragging}
					style="
						top: {topPercent}%;
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
		<div class="posts-list">
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

	.posts-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	@media (max-width: 1080px) {
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

		.recent-posts {
			padding: 0 var(--spacing-md);
		}

		.recent-posts h4 {
			font-size: var(--font-xl);
			margin-bottom: var(--spacing-md);
		}
	}
</style>
