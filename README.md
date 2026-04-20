# CRM Mini

CRM mini project (React + Express + Prisma) using SQL Server.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- ORM: Prisma
- Database: SQL Server

## Backend Setup (SQL Server)

1. Start SQL Server and create a database named `crm_mini`.
2. In `server`, create `.env` from `.env.example`.
3. Update `DATABASE_URL` in `.env` to your SQL Server account.

Example:

```env
DATABASE_URL="sqlserver://localhost:1433;database=crm_mini;user=sa;password=YourStrongPassword123;trustServerCertificate=true"
```

1. Install dependencies and sync Prisma schema:

```bash
cd server
npm install
npm run prisma:generate
npm run prisma:push
```

1. Run backend:

```bash
npm run dev
```

If you prefer pure SQL script, run:

- `server/sql/create_tables.sql`

## Frontend Setup

1. In `client`, create `.env` from `.env.example` and configure API URL if needed.

```bash
cd client
npm install
npm run dev
```

## Run Full Project (One Command)

From project root:

```bash
npm install
npm run dev
```

This command starts both:

- Backend (Express): `http://localhost:5000`
- Frontend (Vite): default `http://localhost:5173` (auto-fallback to next port if busy)

## Notes

- This project is configured for SQL Server, not PostgreSQL.
- Prisma datasource is defined in `server/prisma/schema.prisma` with `provider = "sqlserver"`.

## Production Deploy (Recommended)

### 1) Backend on Render (Web Service)

- Root Directory: `.` (project root)
- Build Command: `npm install && npm run build:server`
- Start Command: `npm run start:server`

Required environment variables on Render:

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=your-secret
SQLSERVER_CONNECTION_STRING=Server=...;Database=...;User Id=...;Password=...;Encrypt=true;TrustServerCertificate=false
```

Important:

- Do not use `npm run dev` on Render.
- Keep `SQL_USE_MSNODESQLV8` unset on Render (Linux).

### 2) Frontend on Vercel

- Deploy from repository root (`.`), using existing `vercel.json`
- Set environment variable:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
```

Then redeploy Vercel after setting the variable.
