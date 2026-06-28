import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { MATCHES, TEAMS } from './data/matches.js';
import { SQUAD_PLAYERS } from './data/squad-players.js';
import { backfillPlatinumStatuses } from './platinum.js';
import { resetSquadScoringCache } from './squad.js';
import { runSchemaMigrations } from './db-migrate.js';
import { sanitizePhotoUrl } from './security.js';
import { reconcileBracketFromFinished } from './bracket-advance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data.db');

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT,
      username TEXT,
      photo_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY,
      home_team_id TEXT NOT NULL REFERENCES teams(id),
      away_team_id TEXT NOT NULL REFERENCES teams(id),
      kickoff TEXT NOT NULL,
      stage TEXT NOT NULL,
      group_name TEXT,
      round INTEGER,
      home_score INTEGER CHECK(home_score IS NULL OR (home_score BETWEEN 0 AND 15)),
      away_score INTEGER CHECK(away_score IS NULL OR (away_score BETWEEN 0 AND 15)),
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'live', 'finished')),
      external_fixture_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      home_score INTEGER NOT NULL CHECK(home_score BETWEEN 0 AND 15),
      away_score INTEGER NOT NULL CHECK(away_score BETWEEN 0 AND 15),
      points INTEGER CHECK(points IS NULL OR (points BETWEEN 0 AND 10)),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, match_id)
    );

    CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
    CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff);

    CREATE TABLE IF NOT EXISTS double_picks (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_day TEXT NOT NULL,
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, game_day)
    );

    CREATE TABLE IF NOT EXISTS tournament_picks (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      winner_team_id TEXT,
      second_team_id TEXT,
      third_team_id TEXT,
      top_scorer_player_id TEXT,
      winner_points INTEGER,
      second_points INTEGER,
      third_points INTEGER,
      scorer_points INTEGER,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tournament_results (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      winner_team_id TEXT,
      second_team_id TEXT,
      third_team_id TEXT,
      top_scorer_player_id TEXT,
      settled_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user_squad (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      player_id TEXT NOT NULL,
      slot INTEGER NOT NULL,
      PRIMARY KEY (user_id, player_id),
      UNIQUE (user_id, slot)
    );

    CREATE TABLE IF NOT EXISTS player_match_stats (
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      player_id TEXT NOT NULL,
      goals INTEGER NOT NULL DEFAULT 0,
      assists INTEGER NOT NULL DEFAULT 0,
      team_won INTEGER NOT NULL DEFAULT 0,
      clean_sheet INTEGER NOT NULL DEFAULT 0,
      goals_conceded INTEGER NOT NULL DEFAULT 0,
      sent_off INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (match_id, player_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_squad_user ON user_squad(user_id);
    CREATE INDEX IF NOT EXISTS idx_player_match_stats_player ON player_match_stats(player_id);

    CREATE TABLE IF NOT EXISTS leagues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS league_members (
      league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (league_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id);

    CREATE TABLE IF NOT EXISTS user_referrals (
      referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      referred_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (referrer_id, referred_id)
    );

    CREATE TABLE IF NOT EXISTS friend_invites (
      inviter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invitee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (inviter_id, invitee_id)
    );

    CREATE INDEX IF NOT EXISTS idx_friend_invites_invitee ON friend_invites(invitee_id);

    CREATE TABLE IF NOT EXISTS notification_log (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      match_id INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL,
      sent_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, match_id, type)
    );
  `);

  migrateDatabase();
  backfillPlatinumStatuses();
  seedIfEmpty();
  syncReferenceData();
  syncMatchesFromCode();
  purgeFriendlyMatches();
  purgeSandboxMatches();
}

function migrateDatabase() {
  const cols = db.prepare(`PRAGMA table_info(player_match_stats)`).all() as Array<{ name: string }>;
  if (!cols.some(c => c.name === 'played')) {
    db.exec(`ALTER TABLE player_match_stats ADD COLUMN played INTEGER NOT NULL DEFAULT 0`);
    db.exec(`UPDATE player_match_stats SET played = 1 WHERE goals > 0 OR assists > 0 OR team_won = 1 OR clean_sheet = 1`);
  }
  if (!cols.some(c => c.name === 'goals_conceded')) {
    db.exec(`ALTER TABLE player_match_stats ADD COLUMN goals_conceded INTEGER NOT NULL DEFAULT 0`);
  }
  if (!cols.some(c => c.name === 'sent_off')) {
    db.exec(`ALTER TABLE player_match_stats ADD COLUMN sent_off INTEGER NOT NULL DEFAULT 0`);
  }

  const userCols = db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>;
  if (!userCols.some(c => c.name === 'is_platinum')) {
    db.exec(`ALTER TABLE users ADD COLUMN is_platinum INTEGER NOT NULL DEFAULT 0`);
    db.exec(`ALTER TABLE users ADD COLUMN platinum_at TEXT`);
  }
  if (!userCols.some(c => c.name === 'squad_confirmed_at')) {
    db.exec(`ALTER TABLE users ADD COLUMN squad_confirmed_at TEXT`);
  }
  if (!userCols.some(c => c.name === 'favorite_team_id')) {
    db.exec(`ALTER TABLE users ADD COLUMN favorite_team_id TEXT REFERENCES teams(id)`);
  }

  const matchCols = db.prepare(`PRAGMA table_info(matches)`).all() as Array<{ name: string }>;
  if (!matchCols.some(c => c.name === 'fantasy_events')) {
    db.exec(`ALTER TABLE matches ADD COLUMN fantasy_events TEXT`);
  }

  const leagueCols = db.prepare(`PRAGMA table_info(leagues)`).all() as Array<{ name: string }>;
  if (!leagueCols.some(c => c.name === 'emoji')) {
    db.exec(`ALTER TABLE leagues ADD COLUMN emoji TEXT NOT NULL DEFAULT '🏆'`);
    db.exec(`UPDATE leagues SET emoji = '🏆' WHERE emoji IS NULL OR emoji = ''`);
  }
  if (!leagueCols.some(c => c.name === 'emoji_bg')) {
    db.exec(`ALTER TABLE leagues ADD COLUMN emoji_bg TEXT NOT NULL DEFAULT '#5b4fd9'`);
  }

  runSchemaMigrations();

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_start_params (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_param TEXT NOT NULL,
      processed_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, start_param)
    );
  `);
}

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM matches').get() as { c: number };
  if (count.c > 0) return;

  const insertTeam = db.prepare('INSERT OR IGNORE INTO teams (id, name, code) VALUES (?, ?, ?)');
  for (const team of Object.values(TEAMS)) {
    insertTeam.run(team.id, team.name, team.code);
  }

  const insertMatch = db.prepare(`
    INSERT INTO matches (id, home_team_id, away_team_id, kickoff, stage, group_name, round)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of MATCHES) {
    insertMatch.run(m.id, m.homeTeamId, m.awayTeamId, m.kickoff, m.stage, m.group ?? null, m.round ?? null);
  }

  console.log(`Seeded ${MATCHES.length} matches and ${Object.keys(TEAMS).length} teams`);
}

/** Удаляет из БД игроков, которых больше нет в актуальных заявках FIFA. */
export function syncRemovedSquadPlayers(): { squad: number; stats: number } {
  const validIds = SQUAD_PLAYERS.map(p => p.id);
  if (validIds.length === 0) return { squad: 0, stats: 0 };

  const placeholders = validIds.map(() => '?').join(', ');
  const squadResult = db.prepare(`
    DELETE FROM user_squad WHERE player_id NOT IN (${placeholders})
  `).run(...validIds);
  const statsResult = db.prepare(`
    DELETE FROM player_match_stats WHERE player_id NOT IN (${placeholders})
  `).run(...validIds);

  if (squadResult.changes > 0 || statsResult.changes > 0) {
    resetSquadScoringCache();
  }
  return { squad: squadResult.changes, stats: statsResult.changes };
}

/** Синхронизация справочников из кода в БД без потери прогнозов пользователей. */
export function syncReferenceData(): number {
  const upsertTeam = db.prepare(`
    INSERT INTO teams (id, name, code) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, code = excluded.code
  `);
  for (const team of Object.values(TEAMS)) {
    upsertTeam.run(team.id, team.name, team.code);
  }

  const updateMatch = db.prepare(`
    UPDATE matches
    SET home_team_id = ?, away_team_id = ?, kickoff = ?, stage = ?, group_name = ?, round = ?
    WHERE id = ? AND status = 'scheduled'
  `);

  let updated = 0;
  for (const m of MATCHES) {
    const result = updateMatch.run(
      m.homeTeamId,
      m.awayTeamId,
      m.kickoff,
      m.stage,
      m.group ?? null,
      m.round ?? null,
      m.id
    );
    updated += result.changes;
  }
  syncRemovedSquadPlayers();
  if (updated > 0) resetSquadScoringCache();
  return updated;
}

/** Добавляет новые матчи из кода (плей-офф) и обновляет расписание scheduled. */
export function syncMatchesFromCode(): number {
  const upsertTeam = db.prepare(`
    INSERT INTO teams (id, name, code) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, code = excluded.code
  `);
  for (const team of Object.values(TEAMS)) {
    upsertTeam.run(team.id, team.name, team.code);
  }

  const insertMatch = db.prepare(`
    INSERT INTO matches (id, home_team_id, away_team_id, kickoff, stage, group_name, round)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const updateMatch = db.prepare(`
    UPDATE matches
    SET home_team_id = ?, away_team_id = ?, kickoff = ?, stage = ?, group_name = ?, round = ?
    WHERE id = ? AND status = 'scheduled'
  `);

  let changed = 0;
  for (const m of MATCHES) {
    const row = db.prepare(`SELECT status FROM matches WHERE id = ?`).get(m.id) as
      | { status: string }
      | undefined;
    if (!row) {
      insertMatch.run(
        m.id,
        m.homeTeamId,
        m.awayTeamId,
        m.kickoff,
        m.stage,
        m.group ?? null,
        m.round ?? null
      );
      changed++;
      continue;
    }
    if (row.status === 'scheduled') {
      const result = updateMatch.run(
        m.homeTeamId,
        m.awayTeamId,
        m.kickoff,
        m.stage,
        m.group ?? null,
        m.round ?? null,
        m.id
      );
      changed += result.changes;
    }
  }
  reconcileBracketFromFinished();
  if (changed > 0) resetSquadScoringCache();
  return changed;
}

/** Удаляет тестовые товарищеские матчи и связанные данные. */
export function purgeFriendlyMatches(): number {
  const ids = db.prepare(`SELECT id FROM matches WHERE stage = 'friendly'`).all() as Array<{ id: number }>;
  if (ids.length === 0) return 0;

  const idList = ids.map(r => r.id);
  const ph = idList.map(() => '?').join(', ');

  db.prepare(`DELETE FROM predictions WHERE match_id IN (${ph})`).run(...idList);
  db.prepare(`DELETE FROM player_match_stats WHERE match_id IN (${ph})`).run(...idList);
  db.prepare(`DELETE FROM double_picks WHERE match_id IN (${ph})`).run(...idList);
  const result = db.prepare(`DELETE FROM matches WHERE stage = 'friendly'`).run();

  if (result.changes > 0) resetSquadScoringCache();
  return result.changes;
}

/** Удаляет sandbox-тестовые матчи и связанные данные. */
export function purgeSandboxMatches(): number {
  const ids = db.prepare(`SELECT id FROM matches WHERE stage = 'sandbox'`).all() as Array<{ id: number }>;
  if (ids.length === 0) return 0;

  const idList = ids.map(r => r.id);
  const ph = idList.map(() => '?').join(', ');

  db.prepare(`DELETE FROM predictions WHERE match_id IN (${ph})`).run(...idList);
  db.prepare(`DELETE FROM player_match_stats WHERE match_id IN (${ph})`).run(...idList);
  db.prepare(`DELETE FROM double_picks WHERE match_id IN (${ph})`).run(...idList);
  const result = db.prepare(`DELETE FROM matches WHERE stage = 'sandbox'`).run();

  if (result.changes > 0) resetSquadScoringCache();
  return result.changes;
}

export interface DbUser {
  id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  favorite_team_id?: string | null;
}

export function upsertUser(user: {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}): DbUser {
  const photoUrl = sanitizePhotoUrl(user.photo_url) ?? null;
  const lastName = user.last_name ?? null;
  const username = user.username ?? null;

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as DbUser | undefined;
  if (existing) {
    const photoUnchanged = photoUrl === null || existing.photo_url === photoUrl;
    if (
      existing.first_name === user.first_name &&
      existing.last_name === lastName &&
      existing.username === username &&
      photoUnchanged
    ) {
      return existing;
    }
  }

  db.prepare(`
    INSERT INTO users (id, first_name, last_name, username, photo_url)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      username = excluded.username,
      photo_url = COALESCE(excluded.photo_url, users.photo_url)
  `).run(user.id, user.first_name, lastName, username, photoUrl);

  return db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as DbUser;
}
