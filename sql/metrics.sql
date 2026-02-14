CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS post_metrics (
	post_id TEXT PRIMARY KEY,
	likes_count INTEGER NOT NULL DEFAULT 0,
	views_count BIGINT NOT NULL DEFAULT 0,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
	post_id TEXT NOT NULL,
	fingerprint TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (post_id, fingerprint)
);

CREATE TABLE IF NOT EXISTS post_view_windows (
	post_id TEXT NOT NULL,
	fingerprint TEXT NOT NULL,
	last_viewed_at TIMESTAMPTZ NOT NULL,
	PRIMARY KEY (post_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_post_view_windows_post_id ON post_view_windows (post_id);

CREATE TABLE IF NOT EXISTS post_comments (
	id BIGSERIAL PRIMARY KEY,
	post_id TEXT NOT NULL,
	author_name VARCHAR(40) NOT NULL,
	password_hash TEXT NOT NULL,
	content TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	deleted_at TIMESTAMPTZ NULL,
	CONSTRAINT chk_post_comments_author_name_not_blank
		CHECK (char_length(btrim(author_name)) BETWEEN 1 AND 40),
	CONSTRAINT chk_post_comments_content_not_blank
		CHECK (char_length(btrim(content)) BETWEEN 1 AND 5000)
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id_created_at
	ON post_comments (post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_comments_active_post_id_created_at
	ON post_comments (post_id, created_at DESC)
	WHERE deleted_at IS NULL;
