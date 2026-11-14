const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "travelbuddy.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");
  db.run(`
    CREATE TABLE IF NOT EXISTS passengers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS shuttles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slot TEXT NOT NULL CHECK(slot IN ('Morning', 'Afternoon', 'Evening')),
      seats INTEGER NOT NULL CHECK(seats > 0),
      status TEXT NOT NULL DEFAULT 'available'
        CHECK(status IN ('available', 'full', 'cancelled'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      passenger_id INTEGER NOT NULL,
      shuttle_id INTEGER NOT NULL,
      reservation_date TEXT NOT NULL DEFAULT (date('now')),
      status TEXT NOT NULL DEFAULT 'confirmed'
        CHECK(status IN ('confirmed', 'cancelled')),
      FOREIGN KEY(passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
      FOREIGN KEY(shuttle_id) REFERENCES shuttles(id) ON DELETE CASCADE
    )
  `);
});

module.exports = db;
