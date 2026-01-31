# CS Advisor - Setup Guide

## Prerequisites

- Node.js 20+
- Docker

---

## Option 1: Dev Mode (Local Development)

### 1. Start PostgreSQL

```bash
docker compose up db -d
```

### 2. Setup & Run Server

```bash
cd server
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

### 3. Run Client

```bash
cd client
npm install
npm run dev
```

### Access

- **Client**: http://localhost:5173
- **Server**: http://localhost:3000

---

## Option 2: Docker Mode (Full Stack)

### Run everything

```bash
docker compose up --build
```

### Access

- **Client**: http://localhost:5173
- **Server**: http://localhost:3000

---


