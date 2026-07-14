-- Scoreboard state (used by /score and /score/admin)
CREATE TABLE IF NOT EXISTS scoreboard_scores (
	team_id TEXT PRIMARY KEY,
	score INTEGER NOT NULL DEFAULT 0,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO scoreboard_scores (team_id, score) VALUES
	('coral', 0),
	('sun', 0),
	('violet', 0),
	('mint', 0)
ON CONFLICT (team_id) DO NOTHING;
