-- Scoreboard state (used by /score and /score/admin)
CREATE TABLE IF NOT EXISTS scoreboard_scores (
	team_id TEXT PRIMARY KEY,
	score INTEGER NOT NULL DEFAULT 0,
	team_name VARCHAR(30) NOT NULL DEFAULT '',
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scoreboard_scores
	ADD COLUMN IF NOT EXISTS team_name VARCHAR(30) NOT NULL DEFAULT '';

INSERT INTO scoreboard_scores (team_id, score, team_name) VALUES
	('coral', 0, '팀 1'),
	('sky', 0, '팀 2'),
	('violet', 0, '팀 3'),
	('green', 0, '팀 4')
ON CONFLICT (team_id) DO NOTHING;
