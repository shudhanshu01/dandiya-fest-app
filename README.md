# Dandiya Fest Entry Pass

A Node.js and Express app for issuing student QR entry passes and verifying them at the event gate. Student and pass-use records are stored in MongoDB.

## Requirements

- Node.js and npm
- A MongoDB database

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

   Set `MONGO_URI` in `.env` to your own MongoDB connection string. Never commit `.env` or share database credentials.

3. Add student documents to the database. Each student needs `rollNumber`, `name`, and `branch` fields. `rollNumber` must be unique; `isUsed` defaults to `false`.

4. Start the server:

   ```sh
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) for student passes. Open [http://localhost:3000/scanner.html](http://localhost:3000/scanner.html) at the gate to scan and verify passes. Camera access requires localhost or HTTPS.

## API

- `POST /api/get-pass` — accepts `{ "rollNumber": "..." }` and returns the student's pass and QR image.
- `POST /api/verify-pass` — accepts `{ "rollNumber": "..." }` and marks an unused pass as used.

## Configuration

- `MONGO_URI` — MongoDB connection string (required).
- `PORT` — HTTP port (defaults to `3000`).
