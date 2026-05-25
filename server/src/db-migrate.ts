import { db } from './db.js';

const SCHEMA_VERSION = 6;

function getSchemaVersion(): number {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  const row = db.prepare(`SELECT value FROM app_meta WHERE key = 'schema_version'`).get() as
    | { value: string }
    | undefined;
  return row ? parseInt(row.value, 10) : 1;
}

function setSchemaVersion(version: number): void {
  db.prepare(`
    INSERT INTO app_meta (key, value) VALUES ('schema_version', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(String(version));
}

function sanitizeBeforeV2(): void {
  db.prepare(`
    UPDATE matches SET status = 'scheduled'
    WHERE status NOT IN ('scheduled', 'live', 'finished')
  `).run();
  db.prepare(`
    UPDATE matches SET home_score = NULL
    WHERE home_score IS NOT NULL AND (home_score < 0 OR home_score > 15)
  `).run();
  db.prepare(`
    UPDATE matches SET away_score = NULL
    WHERE away_score IS NOT NULL AND (away_score < 0 OR away_score > 15)
  `).run();
  db.prepare(`
    UPDATE predictions SET home_score = MAX(0, MIN(15, home_score)),
      away_score = MAX(0, MIN(15, away_score))
    WHERE home_score < 0 OR home_score > 15 OR away_score < 0 OR away_score > 15
  `).run();
}

function rebuildTable(name: string, createSql: string, copySql: string): void {
  db.exec(`DROP TABLE IF EXISTS ${name}_old`);
  db.exec(`ALTER TABLE ${name} RENAME TO ${name}_old`);
  db.exec(createSql);
  db.exec(copySql);
  db.exec(`DROP TABLE ${name}_old`);
}

function migrateToV2(): void {
  sanitizeBeforeV2();

  db.pragma('foreign_keys = OFF');
  const run = db.transaction(() => {
    rebuildTable(
      'matches',
      `CREATE TABLE matches (
        id INTEGER PRIMARY KEY,
        home_team_id TEXT NOT NULL REFERENCES teams(id),
        away_team_id TEXT NOT NULL REFERENCES teams(id),
        kickoff TEXT NOT NULL,
        stage TEXT NOT NULL,
        group_name TEXT,
        round INTEGER,
        home_score INTEGER CHECK(home_score IS NULL OR (home_score BETWEEN 0 AND 15)),
        away_score INTEGER CHECK(away_score IS NULL OR (away_score BETWEEN 0 AND 15)),
        status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'live', 'finished'))
      )`,
      `INSERT INTO matches SELECT * FROM matches_old`
    );

    rebuildTable(
      'predictions',
      `CREATE TABLE predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        home_score INTEGER NOT NULL CHECK(home_score BETWEEN 0 AND 15),
        away_score INTEGER NOT NULL CHECK(away_score BETWEEN 0 AND 15),
        points INTEGER CHECK(points IS NULL OR (points BETWEEN 0 AND 10)),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, match_id)
      )`,
      `INSERT INTO predictions SELECT * FROM predictions_old`
    );

    rebuildTable(
      'double_picks',
      `CREATE TABLE double_picks (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_day TEXT NOT NULL,
        match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, game_day)
      )`,
      `INSERT INTO double_picks SELECT * FROM double_picks_old`
    );

    rebuildTable(
      'tournament_picks',
      `CREATE TABLE tournament_picks (
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
      )`,
      `INSERT INTO tournament_picks SELECT * FROM tournament_picks_old`
    );

    rebuildTable(
      'user_squad',
      `CREATE TABLE user_squad (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        player_id TEXT NOT NULL,
        slot INTEGER NOT NULL,
        PRIMARY KEY (user_id, player_id),
        UNIQUE (user_id, slot)
      )`,
      `INSERT INTO user_squad SELECT * FROM user_squad_old`
    );

    rebuildTable(
      'notification_log',
      `CREATE TABLE notification_log (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        match_id INTEGER NOT NULL DEFAULT 0,
        type TEXT NOT NULL,
        sent_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, match_id, type)
      )`,
      `INSERT INTO notification_log SELECT * FROM notification_log_old`
    );

    rebuildTable(
      'leagues',
      `CREATE TABLE leagues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `INSERT INTO leagues SELECT * FROM leagues_old`
    );

    rebuildTable(
      'league_members',
      `CREATE TABLE league_members (
        league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (league_id, user_id)
      )`,
      `INSERT INTO league_members SELECT * FROM league_members_old`
    );

    rebuildTable(
      'user_referrals',
      `CREATE TABLE user_referrals (
        referrer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (referrer_id, referred_id)
      )`,
      `INSERT INTO user_referrals SELECT * FROM user_referrals_old`
    );

    rebuildTable(
      'friend_invites',
      `CREATE TABLE friend_invites (
        inviter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invitee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (inviter_id, invitee_id)
      )`,
      `INSERT INTO friend_invites SELECT * FROM friend_invites_old`
    );

    rebuildTable(
      'player_match_stats',
      `CREATE TABLE player_match_stats (
        match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        player_id TEXT NOT NULL,
        goals INTEGER NOT NULL DEFAULT 0 CHECK(goals >= 0),
        assists INTEGER NOT NULL DEFAULT 0 CHECK(assists >= 0),
        team_won INTEGER NOT NULL DEFAULT 0,
        clean_sheet INTEGER NOT NULL DEFAULT 0,
        played INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (match_id, player_id)
      )`,
      `INSERT INTO player_match_stats SELECT * FROM player_match_stats_old`
    );

    db.exec(`CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_user_squad_user ON user_squad(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_player_match_stats_player ON player_match_stats(player_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_friend_invites_invitee ON friend_invites(invitee_id)`);

    setSchemaVersion(SCHEMA_VERSION);
  });

  run();
  db.pragma('foreign_keys = ON');
  console.log(`[db] Schema migrated to v${SCHEMA_VERSION}`);
}

function migrateToV3(): void {
  const cols = db.prepare(`PRAGMA table_info(matches)`).all() as Array<{ name: string }>;
  if (!cols.some(c => c.name === 'external_fixture_id')) {
    db.exec(`ALTER TABLE matches ADD COLUMN external_fixture_id INTEGER`);
  }
  setSchemaVersion(3);
  console.log('[db] Schema migrated to v3');
}

function migrateToV4(): void {
  db.exec(`CREATE INDEX IF NOT EXISTS idx_matches_stage_kickoff ON matches(stage, kickoff)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_matches_status_kickoff ON matches(status, kickoff)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_double_picks_match ON double_picks(match_id)`);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_squad_confirmed
    ON users(squad_confirmed_at) WHERE squad_confirmed_at IS NOT NULL
  `);
  setSchemaVersion(4);
  console.log('[db] Schema migrated to v4');
}

function migrateToV5(): void {
  db.exec(`CREATE INDEX IF NOT EXISTS idx_leagues_owner ON leagues(owner_id)`);
  setSchemaVersion(5);
  console.log('[db] Schema migrated to v5');
}

function migrateToV6(): void {
  const cols = db.prepare(`PRAGMA table_info(leagues)`).all() as Array<{ name: string }>;
  if (!cols.some(c => c.name === 'emoji_bg')) {
    db.exec(`ALTER TABLE leagues ADD COLUMN emoji_bg TEXT NOT NULL DEFAULT '#5b4fd9'`);
  }
  setSchemaVersion(SCHEMA_VERSION);
  console.log(`[db] Schema migrated to v${SCHEMA_VERSION}`);
}

/** БД создана актуальным initDatabase(), а не legacy-схемой до v2. */
function isFreshModernInstall(): boolean {
  const matchCols = db.prepare(`PRAGMA table_info(matches)`).all() as Array<{ name: string }>;
  return matchCols.some(c => c.name === 'external_fixture_id');
}

export function runSchemaMigrations(): void {
  const version = getSchemaVersion();
  if (version < 2) {
    if (isFreshModernInstall()) {
      setSchemaVersion(2);
      console.log('[db] Fresh install — skip legacy v2 migration');
    } else {
      migrateToV2();
    }
  }
  if (getSchemaVersion() < 3) migrateToV3();
  if (getSchemaVersion() < 4) migrateToV4();
  if (getSchemaVersion() < 5) migrateToV5();
  if (getSchemaVersion() < SCHEMA_VERSION) migrateToV6();
  repairLeagueMembersForeignKey();
}

/** Починка FK league_members → leagues (ошибка порядка в ранней v2). */
function repairLeagueMembersForeignKey(): void {
  const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'league_members'`).get() as
    | { sql: string }
    | undefined;
  if (!row?.sql?.includes('leagues_old')) return;

  db.pragma('foreign_keys = OFF');
  const repair = db.transaction(() => {
    rebuildTable(
      'league_members',
      `CREATE TABLE league_members (
        league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (league_id, user_id)
      )`,
      `INSERT INTO league_members SELECT * FROM league_members_old`
    );
  });
  repair();
  db.pragma('foreign_keys = ON');
  console.log('[db] Repaired league_members foreign key');
}

/** Удаление пользователя и всех связанных данных (CASCADE после v2). */
export function deleteUser(userId: number): boolean {
  const result = db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
  return result.changes > 0;
}
