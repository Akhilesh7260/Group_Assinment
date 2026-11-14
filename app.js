const express = require("express");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}

const validSlots = ["Morning", "Afternoon", "Evening"];
const validStatuses = ["available", "full", "cancelled"];

app.get("/", (req, res) => {
  res.json({ message: "Welcome to TravelBuddy Cabs API" });
});

// GET all shuttles; optional filter: /shuttles?slot=Morning
app.get("/shuttles", async (req, res, next) => {
  try {
    const { slot } = req.query;
    if (slot && !validSlots.includes(slot)) {
      return res.status(400).json({ error: "slot must be Morning, Afternoon, or Evening" });
    }
    const rows = slot
      ? await all("SELECT * FROM shuttles WHERE slot = ? ORDER BY id", [slot])
      : await all("SELECT * FROM shuttles ORDER BY id");
    res.json(rows);
  } catch (err) { next(err); }
});

// GET one shuttle
app.get("/shuttles/:id", async (req, res, next) => {
  try {
    const row = await get("SELECT * FROM shuttles WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: "Shuttle not found" });
    res.json(row);
  } catch (err) { next(err); }
});

// ADD shuttle
app.post("/shuttles", async (req, res, next) => {
  try {
    const { name, slot, seats, status = "available" } = req.body;
    const errors = [];
    if (typeof name !== "string" || !name.trim()) errors.push("name is required");
    if (!validSlots.includes(slot)) errors.push("slot must be Morning, Afternoon, or Evening");
    if (!Number.isInteger(seats) || seats <= 0) errors.push("seats must be a positive integer");
    if (!validStatuses.includes(status)) errors.push("status must be available, full, or cancelled");
    if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });

    const result = await run(
      "INSERT INTO shuttles (name, slot, seats, status) VALUES (?, ?, ?, ?)",
      [name.trim(), slot, seats, status]
    );
    const created = await get("SELECT * FROM shuttles WHERE id = ?", [result.id]);
    res.status(201).json(created);
  } catch (err) { next(err); }
});

// UPDATE shuttle
app.put("/shuttles/:id", async (req, res, next) => {
  try {
    const existing = await get("SELECT * FROM shuttles WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Shuttle not found" });

    const name = req.body.name ?? existing.name;
    const slot = req.body.slot ?? existing.slot;
    const seats = req.body.seats ?? existing.seats;
    const status = req.body.status ?? existing.status;
    const errors = [];
    if (typeof name !== "string" || !name.trim()) errors.push("name must be a non-empty string");
    if (!validSlots.includes(slot)) errors.push("slot must be Morning, Afternoon, or Evening");
    if (!Number.isInteger(seats) || seats <= 0) errors.push("seats must be a positive integer");
    if (!validStatuses.includes(status)) errors.push("status must be available, full, or cancelled");
    if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });

    await run(
      "UPDATE shuttles SET name = ?, slot = ?, seats = ?, status = ? WHERE id = ?",
      [name.trim(), slot, seats, status, req.params.id]
    );
    res.json(await get("SELECT * FROM shuttles WHERE id = ?", [req.params.id]));
  } catch (err) { next(err); }
});

// DELETE shuttle
app.delete("/shuttles/:id", async (req, res, next) => {
  try {
    const result = await run("DELETE FROM shuttles WHERE id = ?", [req.params.id]);
    if (!result.changes) return res.status(404).json({ error: "Shuttle not found" });
    res.status(200).json({ message: "Shuttle deleted successfully" });
  } catch (err) { next(err); }
});

// Create passenger (helper endpoint for testing the reservation join)
app.post("/passengers", async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "name and email are required" });
    }
    const result = await run("INSERT INTO passengers (name, email) VALUES (?, ?)", [name.trim(), email.trim()]);
    res.status(201).json(await get("SELECT * FROM passengers WHERE id = ?", [result.id]));
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(409).json({ error: "Email already exists" });
    next(err);
  }
});

// Create reservation
app.post("/reservations", async (req, res, next) => {
  try {
    const { passenger_id, shuttle_id } = req.body;
    if (!Number.isInteger(passenger_id) || !Number.isInteger(shuttle_id)) {
      return res.status(400).json({ error: "passenger_id and shuttle_id must be integers" });
    }
    const passenger = await get("SELECT id FROM passengers WHERE id = ?", [passenger_id]);
    const shuttle = await get("SELECT id, status FROM shuttles WHERE id = ?", [shuttle_id]);
    if (!passenger) return res.status(404).json({ error: "Passenger not found" });
    if (!shuttle) return res.status(404).json({ error: "Shuttle not found" });
    if (shuttle.status !== "available") return res.status(409).json({ error: "Shuttle is not available" });

    const result = await run(
      "INSERT INTO reservations (passenger_id, shuttle_id) VALUES (?, ?)",
      [passenger_id, shuttle_id]
    );
    res.status(201).json(await get("SELECT * FROM reservations WHERE id = ?", [result.id]));
  } catch (err) { next(err); }
});

// JOIN endpoint: reservation with passenger name and shuttle name
app.get("/reservations", async (req, res, next) => {
  try {
    const rows = await all(`
      SELECT r.id, r.reservation_date, r.status,
             p.id AS passenger_id, p.name AS passenger_name,
             s.id AS shuttle_id, s.name AS shuttle_name, s.slot
      FROM reservations r
      JOIN passengers p ON r.passenger_id = p.id
      JOIN shuttles s ON r.shuttle_id = s.id
      ORDER BY r.id
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// Custom twist: count shuttles grouped by slot
app.get("/shuttles/summary", async (req, res, next) => {
  try {
    const rows = await all(`
      SELECT slot, COUNT(*) AS shuttleCount
      FROM shuttles
      GROUP BY slot
      ORDER BY CASE slot
        WHEN 'Morning' THEN 1 WHEN 'Afternoon' THEN 2 ELSE 3 END
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// 404 for unknown routes
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => console.log(`TravelBuddy Cabs API running at http://localhost:${PORT}`));
