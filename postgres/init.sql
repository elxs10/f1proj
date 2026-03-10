CREATE TABLE IF NOT EXISTS sessions (
  session_key    INTEGER PRIMARY KEY,
  session_name   TEXT,
  session_type   TEXT,
  date_start     TIMESTAMP,
  circuit_key    INTEGER,
  circuit_name   TEXT,
  location       TEXT,
  country        TEXT,
  year           INTEGER
);

CREATE TABLE IF NOT EXISTS drivers (
  session_key    INTEGER,
  driver_number  INTEGER,
  code           TEXT,
  full_name      TEXT,
  team_name      TEXT,
  team_colour    TEXT,
  headshot_url   TEXT,
  PRIMARY KEY (session_key, driver_number)
);

CREATE TABLE IF NOT EXISTS race_results (
  session_key    INTEGER,
  driver_number  INTEGER,
  position       INTEGER,
  fastest_lap    TEXT,
  pits           INTEGER,
  PRIMARY KEY (session_key, driver_number)
);

CREATE TABLE IF NOT EXISTS calendar (
  meeting_key    INTEGER PRIMARY KEY,
  meeting_name   TEXT,
  location       TEXT,
  country        TEXT,
  year           INTEGER,
  date_start     TIMESTAMP
);