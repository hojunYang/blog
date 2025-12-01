<script lang="ts">
	let currentPath = $state('');
	
	$effect(() => {
		currentPath = window.location.pathname;
	});
</script>

<header>
	<nav>
		<div class="container">
			<a href="/" class="logo">
				<span class="logo-text">Hojun Yang</span>
			</a>
			<div class="nav-links">
				<a href="/post" class:active={currentPath === '/post'}>모든 글</a>
			</div>
		</div>
	</nav>
</header>

<style>
	header {
		position: sticky;		
		max-width: var(--container-max-width);
		top: 0;
		-webkit-mask-image: linear-gradient(to bottom, black 0%, black 70%, transparent 100%);
		mask-image: linear-gradient(to bottom, black 0%, black 70%, transparent 100%);
	}

	header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(to top, rgb(247, 250, 252, 0.80), rgb(247, 250, 252, 0.95));
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		z-index: -1;
	}

	header::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(to top, rgba(247, 250, 252, 0.7), rgba(247, 250, 252, 0.75));
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		z-index: -1;
	}

	nav {
		padding: 0;
	}

	.container {
		margin: 10px auto;
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
		color: var(--color-text-primary);
		font-size: var(--font-2xl);
		font-weight: bold;
		transition: transform var(--transition-fast);
	}

	.logo:hover {
		transform: scale(1.05);
		color: var(--color-text-hover);
	}

	/* .logo-icon {
		font-size: var(--font-3xl);
	} */

	.logo-text {
		font-size: var(--font-2xl);
	}

	.nav-links {
		display: flex;
		gap: var(--spacing-xl);
	}

	.nav-links a {
		color: var(--color-text-primary);
		text-decoration: none;
		font-size: var(--font-lg);
		font-weight: 600;
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
	}

	.nav-links a:hover {
		transform: scale(1.05);
		color: var(--color-text-hover);
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
</style>

