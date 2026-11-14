# TravelBuddy Cabs – Backend Development Fundamentals

A Node.js + Express REST API with SQLite for managing campus shuttles, passengers, and reservations.

## Requirements
- Node.js (LTS recommended)
- npm
- Postman (for API testing)

## Setup (Windows)
1. Extract the ZIP file.
2. Open the `TravelBuddy_Cabs` folder in VS Code or your IDE.
3. Open Terminal in that folder.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the server:
   ```bash
   npm start
   ```
6. Open `http://localhost:3000/`.

The SQLite database file `travelbuddy.db` is created automatically when the server starts. The three tables are created automatically by `database.js`. `initDB.sql` is also included as the standalone schema script.

## Database tables
- `passengers`: passenger name and email.
- `shuttles`: shuttle name, slot, seats, and status.
- `reservations`: passenger/shuttle foreign keys, date, and status.

Allowed shuttle slots: `Morning`, `Afternoon`, `Evening`.
Allowed shuttle statuses: `available`, `full`, `cancelled`.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Welcome message |
| GET | `/shuttles` | Get all shuttles |
| GET | `/shuttles?slot=Morning` | Search shuttles by slot |
| GET | `/shuttles/:id` | Get one shuttle |
| POST | `/shuttles` | Add shuttle |
| PUT | `/shuttles/:id` | Update shuttle |
| DELETE | `/shuttles/:id` | Delete shuttle |
| POST | `/passengers` | Add passenger (testing/helper endpoint) |
| POST | `/reservations` | Create reservation |
| GET | `/reservations` | Joined reservation details |
| GET | `/shuttles/summary` | Count shuttles grouped by slot |

## Postman examples

### Add a shuttle – POST `/shuttles`
Body → raw → JSON:
```json
{
  "name": "Campus Express",
  "slot": "Morning",
  "seats": 40,
  "status": "available"
}
```

### Add another slot – POST `/shuttles`
```json
{
  "name": "Afternoon Campus Shuttle",
  "slot": "Afternoon",
  "seats": 35
}
```

### Validation test – POST `/shuttles`
```json
{
  "name": "",
  "slot": "Night",
  "seats": -2
}
```
Expected: HTTP `400 Bad Request` with a clear `details` list.

### Search – GET `/shuttles?slot=Morning`

### Summary – GET `/shuttles/summary`
Example response:
```json
[
  { "slot": "Morning", "shuttleCount": 1 },
  { "slot": "Afternoon", "shuttleCount": 1 }
]
```
The summary uses SQL `GROUP BY`. If there are no shuttles, it returns HTTP 200 with an empty array `[]`.

### Add passenger – POST `/passengers`
```json
{
  "name": "Akhilesh",
  "email": "akhilesh@example.com"
}
```

### Create reservation – POST `/reservations`
Use the IDs returned by the passenger and shuttle requests:
```json
{
  "passenger_id": 1,
  "shuttle_id": 1
}
```

### Joined reservations – GET `/reservations`
Returns reservation information together with passenger name and shuttle name using SQL `JOIN`.

## HTTP status codes
- `200`: successful GET, update, or delete.
- `201`: resource created.
- `400`: invalid input / validation failure.
- `404`: requested resource or route not found.
- `409`: conflict, such as duplicate email or unavailable shuttle.
- `500`: unexpected server error.

## Notes
- Data is stored in the local SQLite file `travelbuddy.db`.
- Do not upload real personal passenger information to a public repository.
- The assignment brief asks for Postman evidence and a README. Save your own screenshots in a `screenshots/` folder before submission.
