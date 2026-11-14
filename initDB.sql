PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS passengers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS shuttles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slot TEXT NOT NULL CHECK(slot IN ('Morning', 'Afternoon', 'Evening')),
  seats INTEGER NOT NULL CHECK(seats > 0),
  status TEXT NOT NULL DEFAULT 'available'
    CHECK(status IN ('available', 'full', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  passenger_id INTEGER NOT NULL,
  shuttle_id INTEGER NOT NULL,
  reservation_date TEXT NOT NULL DEFAULT (date('now')),
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK(status IN ('confirmed', 'cancelled')),
  FOREIGN KEY(passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
  FOREIGN KEY(shuttle_id) REFERENCES shuttles(id) ON DELETE CASCADE
);
