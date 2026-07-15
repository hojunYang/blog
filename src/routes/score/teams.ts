export const TEAM_IDS = ['coral', 'sky', 'violet', 'green'] as const;
export type TeamId = (typeof TEAM_IDS)[number];
