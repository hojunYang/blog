<footer>
	<div class="container">
		<p>&copy; {new Date().getFullYear()} Hojun Yang. All rights reserved.</p>
		<p class="tagline">Contact: hojun5104@gmail.com</p> 
	</div>
</footer>

<style>
	footer {
		background: var(--color-bg-light);
		color: --color-text-primary;
		padding: var(--spacing-xl) 0;
		margin-top: auto;
	}

	.container {
		max-width: var(--container-max-width);
		margin: 0 auto;
		padding: 0 var(--spacing-xl);
		text-align: center;
	}

	p {
		margin: var(--spacing-sm) 0;
		font-size: var(--font-sm);
	}

	.tagline {
		font-size: var(--font-sm);
		opacity: 0.9;
	}

	@media (max-width: 768px) {
		footer {
			padding: var(--spacing-lg) 0;
		}

		.container {
			padding: 0 var(--spacing-md);
		}

		p {
			font-size: var(--font-xs);
		}
		
		.tagline {
			font-size: var(--font-xs);
		}
	}
</style>

