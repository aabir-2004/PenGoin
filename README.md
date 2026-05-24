---
title: Pengoin Backend
emoji: 🐧
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

<div align="center">

# PenGoin

### Real-time collaborative whiteboard & presentation workspace

Built for seamless multiplayer collaboration, live presenting, visual thinking, and shared creative workflows.

</div>

---

## ✦ Features

- Real-time collaborative infinite canvas
- Multi-page workspace for boards, slides, and visual flows
- Presentation mode with synchronized navigation
- Screen lock for viewer-safe presenting
- Read-only viewing mode
- Export boards as PNG and PDF
- Advanced shape and styling controls
- Adjustable text sizing
- Persistent room snapshots
- Optional AI-assisted shape cleanup

---

## ✦ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Canvas Engine | tldraw |
| State Management | Zustand |
| Realtime Sync | WebSocket |
| Backend | Fastify |
| Persistence | Supabase |
| Styling | Tailwind CSS |

---

# ✦ Project Structure

```text
PenGoin/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── board/
│   │   └── layout/
│   └── store/
├── public/
├── server.ts
├── Dockerfile
└── package.json
```

---

# ✦ Architecture Overview

PenGoin consists of two primary systems:

### Frontend Workspace
A browser-based collaborative canvas application supporting multi-user editing, presentation flows, exports, and live synchronization.

### Sync Server
A lightweight realtime synchronization server responsible for collaborative room state updates over WebSocket connections.

Room snapshots can optionally persist across restarts using external storage integration.

---

# ✦ Local Setup

## Prerequisites

- Node.js 20+
- npm

---

## Installation

```bash
git clone https://github.com/aabir-2004/PenGoin.git
cd PenGoin
npm install
```

---

# ✦ Configuration

PenGoin uses local environment configuration files for optional services such as:

- realtime networking
- persistence
- AI-assisted tools

Create the appropriate local configuration files before running the application.

---

# ✦ Running the App

## Start the sync server

```bash
npm run sync
```

## Start the frontend

```bash
npm run dev
```

---

## Access

| Service | Address |
|---|---|
| Frontend | `http://localhost:3000` |
| Sync Server | `ws://localhost` |

---

# ✦ Persistence Setup

To enable persistent collaborative room snapshots:

1. Create your database project
2. Initialize the required schema
3. Add your local configuration values
4. Start the sync server

Without persistence configured, rooms operate entirely in memory.

---

# ✦ Available Scripts

```bash
npm run dev     # Start frontend development server
npm run build   # Build frontend
npm run start   # Start production frontend
npm run sync    # Start realtime sync server
npm run lint    # Run ESLint
```

---

# ✦ Deployment

## Frontend

Deploy the frontend independently on any modern web hosting platform.

---

## Sync Server

The included Dockerfile is configured for the realtime sync server.

```bash
docker build -t pengoin-sync .
docker run pengoin-sync
```

---

# ✦ Current Product Focus

PenGoin currently focuses on:

- collaborative whiteboarding
- multi-page visual workspaces
- live presenting
- exporting
- realtime synchronization

rather than traditional document editing.

---

# ✦ Notes

- Sharing UI exists but sharing flow implementation is still in progress
- Some metadata still contains placeholder defaults and should be updated before production deployment

---

<div align="center">

## PenGoin

Collaborative thinking, presented live.

</div>
