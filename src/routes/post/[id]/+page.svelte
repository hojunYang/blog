<script lang="ts">
	import { onMount } from 'svelte';
	import type { MetricEventResult, PostComment, PostMetrics } from '$lib/types';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const post = $derived(data.post);
	let metrics = $state<PostMetrics | null>(data.metrics ?? null);
	let comments = $state<PostComment[]>(data.comments ?? []);
	let likePending = $state(false);
	let commentAuthorName = $state('');
	let commentPassword = $state('');
	let commentContent = $state('');
	let commentPending = $state(false);
	let commentError = $state('');
	let commentSuccess = $state('');
	let editingCommentId = $state<number | null>(null);
	let editPassword = $state('');
	let editContent = $state('');
	let editPending = $state(false);
	let deletePending = $state(false);
	let editError = $state('');
	let viewRequested = false;

	function fallbackMetrics(postId: string): PostMetrics {
		return {
			postId,
			likes: 0,
			views: 0,
			likedByMe: false
		};
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatCommentDateTime(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function readApiErrorMessage(response: Response): Promise<string> {
		try {
			const payload = (await response.json()) as { message?: string };
			return payload.message || '요청 처리 중 오류가 발생했습니다';
		} catch {
			return '요청 처리 중 오류가 발생했습니다';
		}
	}

	async function requestMetrics(path: string): Promise<MetricEventResult | null> {
		try {
			const response = await fetch(path, {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				}
			});
			if (!response.ok) return null;
			return (await response.json()) as MetricEventResult;
		} catch {
			return null;
		}
	}

	async function handleLike() {
		if (!post || likePending) return;

		likePending = true;
		const result = await requestMetrics(`/api/posts/${post.id}/like`);
		if (result) {
			metrics = result.metrics;
		}
		likePending = false;
	}

	async function handleCreateComment(event: SubmitEvent) {
		event.preventDefault();
		if (!post || commentPending) return;

		commentError = '';
		commentSuccess = '';
		commentPending = true;

		try {
			const response = await fetch(`/api/posts/${post.id}/comments`, {
				method: 'POST',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					authorName: commentAuthorName,
					password: commentPassword,
					content: commentContent
				})
			});

			if (!response.ok) {
				commentError = await readApiErrorMessage(response);
				return;
			}

			const payload = (await response.json()) as { comment?: PostComment };
			if (payload.comment) {
				comments = [payload.comment, ...comments];
				commentContent = '';
				commentPassword = '';
				commentSuccess = '댓글이 등록되었습니다';
				return;
			}

			commentError = '댓글 응답 형식이 올바르지 않습니다';
		} catch {
			commentError = '네트워크 오류로 댓글 등록에 실패했습니다';
		} finally {
			commentPending = false;
		}
	}

	function resetEditState(): void {
		editingCommentId = null;
		editPassword = '';
		editContent = '';
		editError = '';
		editPending = false;
		deletePending = false;
	}

	function startEditComment(comment: PostComment): void {
		if (editPending || deletePending) return;
		editingCommentId = comment.id;
		editPassword = '';
		editContent = comment.content;
		editError = '';
	}

	function cancelEditComment(): void {
		if (editPending || deletePending) return;
		resetEditState();
	}

	async function handleUpdateComment(commentId: number): Promise<void> {
		if (!post || editingCommentId !== commentId || editPending || deletePending) return;

		editError = '';
		editPending = true;

		try {
			const response = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
				method: 'PATCH',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					password: editPassword,
					content: editContent
				})
			});

			if (!response.ok) {
				editError = await readApiErrorMessage(response);
				return;
			}

			const payload = (await response.json()) as { comment?: PostComment };
			if (!payload.comment) {
				editError = '댓글 응답 형식이 올바르지 않습니다';
				return;
			}

			const updatedComment = payload.comment;
			comments = comments.map((comment) => (comment.id === commentId ? updatedComment : comment));
			resetEditState();
		} catch {
			editError = '네트워크 오류로 댓글 수정에 실패했습니다';
		} finally {
			editPending = false;
		}
	}

	async function handleDeleteComment(commentId: number): Promise<void> {
		if (!post || editingCommentId !== commentId || deletePending || editPending) return;

		editError = '';
		deletePending = true;

		try {
			const response = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
				method: 'DELETE',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					password: editPassword
				})
			});

			if (!response.ok) {
				editError = await readApiErrorMessage(response);
				return;
			}

			comments = comments.filter((comment) => comment.id !== commentId);
			resetEditState();
		} catch {
			editError = '네트워크 오류로 댓글 삭제에 실패했습니다';
		} finally {
			deletePending = false;
		}
	}

	onMount(async () => {
		if (!post || viewRequested) return;
		viewRequested = true;
		const result = await requestMetrics(`/api/posts/${post.id}/view`);
		if (result) {
			metrics = result.metrics;
		}
	});

	$effect(() => {
		if (!post) return;
		metrics = data.metrics ?? fallbackMetrics(post.id);
		comments = data.comments ?? [];
		commentError = '';
		commentSuccess = '';
		commentPassword = '';
		commentContent = '';
		resetEditState();
	});
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
					<span class="date">{formatDate(post.date)}</span>
				</div>
				{#if metrics}
					<div class="engagement">
						<button class="like-button" class:active={metrics.likedByMe} onclick={handleLike} disabled={likePending} aria-label="좋아요 토글">
							좋아요 {metrics.likes}
						</button>
						<span class="metric">조회수 {metrics.views}</span>
					</div>
				{/if}
				<div class="tags">
					{#each post.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</header>

			<div class="post-content">
				{@html post.content}
			</div>

			<section class="comments-section" aria-labelledby="comments-title">
				<div class="comments-header">
					<h2 id="comments-title">댓글</h2>
					<span class="comments-count">{comments.length}개</span>
				</div>

				<form id="comment-create-form" class="comment-form" onsubmit={handleCreateComment}>
					<div class="comment-input-row">
						<input
							type="text"
							class="comment-input"
							placeholder="이름"
							bind:value={commentAuthorName}
							maxlength="40"
							autocomplete="off"
							required
						/>
						<input
							type="password"
							class="comment-input"
							placeholder="비밀번호"
							bind:value={commentPassword}
							maxlength="128"
							autocomplete="off"
							required
						/>
					</div>
					<textarea
						class="comment-textarea"
						placeholder="여러분의 소중한 댓글을 입력해주세요."
						bind:value={commentContent}
						maxlength="5000"
						required
					></textarea>
				</form>
				<div class="comment-form-actions">
					<div class="comment-feedback-wrap">
						{#if commentError}
							<p class="comment-feedback error">{commentError}</p>
						{:else if commentSuccess}
							<p class="comment-feedback success">{commentSuccess}</p>
						{/if}
					</div>
					<button
						type="submit"
						form="comment-create-form"
						class="comment-submit-button"
						disabled={commentPending ||
							commentAuthorName.trim().length === 0 ||
							commentPassword.trim().length === 0 ||
							commentContent.trim().length === 0}
					>
						{commentPending ? '등록 중...' : '등록'}
					</button>
				</div>

				{#if comments.length === 0}
					<p class="empty-comment">첫 댓글을 남겨보세요.</p>
				{:else}
					<ul class="comment-list">
						{#each comments as comment (comment.id)}
							<li class="comment-item">
								<div class="comment-meta">
									<strong>{comment.authorName}</strong>
									<div class="comment-meta-right">
										<time datetime={comment.createdAt}>{formatCommentDateTime(comment.createdAt)}</time>
										{#if editingCommentId !== comment.id}
											<button type="button" class="comment-action-link" onclick={() => startEditComment(comment)}>
												수정
											</button>
										{/if}
									</div>
								</div>
								{#if editingCommentId === comment.id}
									<div class="comment-edit-panel">
										<input
											type="password"
											class="comment-edit-input"
											placeholder="비밀번호"
											bind:value={editPassword}
											maxlength="128"
											autocomplete="off"
											required
										/>
										<textarea
											class="comment-edit-textarea"
											bind:value={editContent}
											maxlength="5000"
											required
										></textarea>
										{#if editError}
											<p class="comment-feedback error">{editError}</p>
										{/if}
										<div class="comment-edit-actions">
											<button
												type="button"
												class="comment-mini-button"
												onclick={() => handleUpdateComment(comment.id)}
												disabled={editPending ||
													deletePending ||
													editPassword.trim().length === 0 ||
													editContent.trim().length === 0}
											>
												{editPending ? '저장 중...' : '저장'}
											</button>
											<button
												type="button"
												class="comment-mini-button danger"
												onclick={() => handleDeleteComment(comment.id)}
												disabled={editPending || deletePending || editPassword.trim().length === 0}
											>
												{deletePending ? '삭제 중...' : '삭제'}
											</button>
											<button
												type="button"
												class="comment-mini-button"
												onclick={cancelEditComment}
												disabled={editPending || deletePending}
											>
												취소
											</button>
										</div>
									</div>
								{:else}
									<p>{comment.content}</p>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
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
		border-bottom: 1px solid var(--stroke);
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
		margin-bottom: var(--spacing-sm);
		color: var(--color-text-muted);
	}

	.date {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.engagement {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
		margin-bottom: var(--spacing-md);
	}

	.like-button {
		border: none;
		background: transparent;
		color: var(--text-muted);
		padding: 0;
		border-radius: 999px;
		font-size: var(--font-sm);
		font-weight: 700;
		cursor: pointer;
		transition: transform var(--transition-fast), opacity var(--transition-fast);
		line-height: 1.2;
	}

	.like-button:disabled {
		opacity: 0.7;
		cursor: default;
	}
	.like-button:hover {
		color: #ff2d55;
		transform: scale(1.05);
	}
	.like-button.active {
		color: #ff2d55;
	}

	.metric {
		font-size: var(--font-sm);
		color: var(--text-muted);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.tag {
		background: transparent;
		color: var(--text-muted);
		padding: 2px 0;
		border-radius: var(--radius-full);
		font-size: var(--font-xs);
		font-weight: 600;
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
		color: #24292f;
	}

	.post-content :global(pre) {
		background: #282c34 !important;
		padding: var(--spacing-lg);
		border-radius: var(--radius-md);
		overflow-x: auto;
		margin: var(--spacing-lg) 0;
	}

	.post-content :global(pre code) {
		background: none !important;
		padding: 0;
		font-size: var(--font-sm);
		line-height: 1.5;
		color: #dcdcdc;
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

	.comments-section {
		margin-top: var(--spacing-2xl);
		padding-top: var(--spacing-2xl);
		border-top: 1px solid var(--stroke);
	}

	.comments-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: var(--spacing-sm);
	}

	.comments-header h2 {
		margin: 0;
		font-size: var(--font-lg);
		font-weight: 600;
	}

	.comments-count {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.comment-form {
		display: flex;
		flex-direction: column;
		gap: 0;
		margin-top: var(--spacing-lg);
		margin-bottom: var(--spacing-sm);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.comment-input-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.comment-input,
	.comment-textarea {
		border: none;
		background: transparent;
		padding: var(--spacing-sm) var(--spacing-md);
		font-size: var(--font-sm);
		color: var(--color-text-primary);
	}

	.comment-input {
		border-bottom: 1px solid var(--color-border-light);
	}

	.comment-input:first-child {
		border-right: 1px solid var(--color-border-light);
	}

	.comment-input::placeholder,
	.comment-textarea::placeholder {
		color: var(--color-text-muted);
	}

	.comment-input:focus,
	.comment-textarea:focus {
		outline: none;
		background: var(--color-bg-light);
	}

	.comment-textarea {
		resize: vertical;
		min-height: 110px;
		font-size: var(--font-sm);
		line-height: 1.6;
		border-bottom: none;
	}

	.comment-form-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-lg);
	}

	.comment-feedback-wrap {
		min-height: calc(var(--font-sm) * 1.4);
		flex: 1;
	}

	.comment-feedback {
		margin: 0;
		font-size: var(--font-xs);
	}

	.comment-feedback.error {
		color: #d12f2f;
	}

	.comment-feedback.success {
		color: #0f7a35;
	}

	.comment-submit-button {
		border: 1px solid var(--color-border-light);
		background: transparent;
		color: var(--color-text-primary);
		min-width: 92px;
		padding: 0.4rem 0.8rem;
		font-size: var(--font-sm);
		font-weight: 600;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			border-color var(--transition-fast),
			color var(--transition-fast),
			opacity var(--transition-fast);
	}

	.comment-submit-button:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.comment-submit-button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.empty-comment {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--font-sm);
	}

	.comment-list {
		list-style: none;
		margin-top: var(--spacing-2xl);
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.comment-item {
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		padding: var(--spacing-sm) var(--spacing-md);
		background: var(--color-bg-white);
	}

	.comment-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
	}

	.comment-meta-right {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.comment-meta strong {
		font-size: var(--font-sm);
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.comment-meta time {
		font-size: var(--font-xs);
		color: var(--color-text-muted);
	}

	.comment-action-link {
		border: none;
		background: transparent;
		padding: 0;
		font-size: var(--font-xs);
		color: var(--color-text-muted);
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
		transition: color var(--transition-fast);
	}

	.comment-action-link:hover {
		color: var(--color-primary);
	}

	.comment-edit-panel {
		margin-top: var(--spacing-xs);
		padding-top: var(--spacing-sm);
		border-top: 1px dashed var(--color-border-light);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.comment-edit-input,
	.comment-edit-textarea {
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-primary);
		padding: 0.35rem 0.55rem;
		font-size: var(--font-sm);
	}

	.comment-edit-input::placeholder {
		color: var(--color-text-muted);
	}

	.comment-edit-input:focus,
	.comment-edit-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}

	.comment-edit-textarea {
		resize: vertical;
		min-height: 84px;
		line-height: 1.5;
	}

	.comment-edit-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.comment-mini-button {
		border: 1px solid var(--color-border-light);
		background: transparent;
		color: var(--color-text-primary);
		font-size: var(--font-xs);
		font-weight: 600;
		padding: 0.28rem 0.55rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: border-color var(--transition-fast), color var(--transition-fast), opacity var(--transition-fast);
	}

	.comment-mini-button:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.comment-mini-button.danger {
		color: #b42318;
		border-color: #f1c5c5;
	}

	.comment-mini-button.danger:hover {
		color: #d12f2f;
		border-color: #d12f2f;
	}

	.comment-mini-button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.comment-item p {
		margin: 0;
		white-space: pre-wrap;
		line-height: 1.55;
		font-size: var(--font-sm);
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
		background: var(--color-primary);
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

		.comment-input-row {
			grid-template-columns: 1fr;
		}

		.comment-input:first-child {
			border-right: none;
		}

		.comment-form-actions {
			gap: var(--spacing-sm);
			align-items: flex-start;
			flex-direction: column;
		}

		.comment-feedback-wrap {
			width: 100%;
		}

		.comment-meta {
			align-items: flex-start;
		}

		.comment-meta-right {
			align-self: flex-start;
		}

		.comment-edit-actions {
			width: 100%;
		}

		.comment-submit-button {
			width: auto;
			font-size: var(--font-sm);
		}

		.comment-textarea {
			font-size: var(--font-sm);
		}
	}
</style>
