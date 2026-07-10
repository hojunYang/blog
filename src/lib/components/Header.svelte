<script lang="ts">
	let currentPath = $state('');
	let lastScrollY = $state(0);
	let isScrollingDown = $state(false);
	
	$effect(() => {
		currentPath = window.location.pathname;
		
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			
			if (currentScrollY > lastScrollY && currentScrollY > 50) {
				// 스크롤 다운
				isScrollingDown = true;
			} else {
				// 스크롤 업
				isScrollingDown = false;
			}
			
			lastScrollY = currentScrollY;
		};
		
		window.addEventListener('scroll', handleScroll, { passive: true });
		
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});
</script>
 
<header class:hidden={isScrollingDown}>
	<nav>
		<div class="container">
			<a href="/" class="logo">
				<span class="logo-text">Hojun Yang Blog</span>
			</a>
			<div class="nav-links">
				<a href="/post" class:active={currentPath === '/post'}>Post</a>
			</div>
		</div>
	</nav>
</header>

<style>
header {
	position: sticky;
	top: 0;
	width: 100%;
	transform: translateY(0);
	transition: transform var(--transition-base);
	will-change: transform;
	z-index: 100;
	background: transparent;
	box-shadow: none;
}

header.hidden {
	transform: translateY(-100%);
}

nav {
	padding: 0;
}

	.container {
		margin: 4px auto;
		padding: var(--spacing-md) var(--spacing-xl);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-sm);
		text-decoration: none;
		color: var(--text);
		font-size: var(--font-2xl);
		transition:
			transform var(--transition-fast),
			color var(--transition-fast);
	}

	.logo:active {
		transform: scale(0.97);
	}

	/* .logo-icon {
		font-size: var(--font-3xl);
	} */

	.logo-text {
		font-family: var(--font-mono);
		font-size: var(--font-2xl);
	}

	.nav-links {
		display: flex;
		gap: var(--spacing-xl);
	}

	.nav-links a {
		color: var(--text);
		text-decoration: none;
		font-family: var(--font-mono);
		font-size: var(--font-lg);
		font-weight: 400;
		border-radius: var(--radius-md);
		transition:
			transform var(--transition-fast),
			color var(--transition-fast);
		padding: 6px 10px;
	}

	.nav-links a:active {
		transform: scale(0.97);
	}

	@media (hover: hover) and (pointer: fine) {
		.logo:hover {
			transform: scale(1.02);
			color: var(--color-text-hover);
		}

		.nav-links a:hover {
			transform: translateY(-1px);
			color: var(--link);
		}
	}

	@media (max-width: 768px) {
		.container {
			padding: var(--spacing-md);
		}

		.logo-text {
			font-size: var(--font-xl);
		}

		.nav-links {
			gap: var(--spacing-md);
		}

		.nav-links a {
			padding: var(--spacing-sm);
			font-size: var(--font-sm);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		header {
			transform: none;
			transition: opacity 120ms linear;
			will-change: auto;
		}

		header.hidden {
			transform: none;
			opacity: 0;
			pointer-events: none;
		}

		.logo:active,
		.nav-links a:active {
			transform: none;
		}

		.logo:hover,
		.nav-links a:hover {
			transform: none;
		}
	}
</style>
