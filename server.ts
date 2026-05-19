import 'dotenv/config';
import cors from '@fastify/cors';
import websocketPlugin from '@fastify/websocket';
import fastify from 'fastify';
import type { RawData } from 'ws';
import { TLSocketRoom, RoomSnapshot } from '@tldraw/sync-core';
import { createClient } from '@supabase/supabase-js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 1234;

// Optional Supabase persistence
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log('[tldraw] Supabase persistence enabled');
} else {
  console.log('[tldraw] No Supabase config — snapshots stored in memory only');
}

// Load a snapshot from Supabase (returns null if not found)
async function loadSnapshot(roomId: string): Promise<RoomSnapshot | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('documents')
    .select('state')
    .eq('name', roomId)
    .single();
  if (data?.state) {
    try {
      return JSON.parse(
        Buffer.from(data.state as string, 'base64').toString('utf-8')
      ) as RoomSnapshot;
    } catch {
      return null;
    }
  }
  return null;
}

// Save a snapshot to Supabase
async function saveSnapshot(roomId: string, snapshot: RoomSnapshot) {
  if (!supabase) return;
  const state = Buffer.from(JSON.stringify(snapshot)).toString('base64');
  await supabase
    .from('documents')
    .upsert({ name: roomId, state });
}

// Sanitize roomId to prevent path traversal
function sanitizeRoomId(roomId: string): string {
  return roomId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

// In-memory map of active rooms
const rooms = new Map<string, TLSocketRoom>();

async function makeOrLoadRoom(roomId: string): Promise<TLSocketRoom> {
  roomId = sanitizeRoomId(roomId);

  const existing = rooms.get(roomId);
  if (existing && !existing.isClosed()) {
    return existing;
  }

  console.log(`[tldraw] Loading room: ${roomId}`);
  const initialSnapshot = await loadSnapshot(roomId);

  // Debounce saves — don't hammer Supabase on every keystroke
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const scheduleSave = (room: TLSocketRoom) => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveSnapshot(roomId, room.getCurrentSnapshot()).catch(console.error);
    }, 2000);
  };

  const room = new TLSocketRoom({
    initialSnapshot: initialSnapshot ?? undefined,
    onDataChange() {
      scheduleSave(room);
    },
    onSessionRemoved(room, args) {
      console.log(
        `[tldraw] Client disconnected: ${args.sessionId} (room: ${roomId})`
      );
      if (args.numSessionsRemaining === 0) {
        // Save final snapshot before closing
        saveSnapshot(roomId, room.getCurrentSnapshot())
          .then(() => {
            console.log(`[tldraw] Closing empty room: ${roomId}`);
            if (saveTimer) clearTimeout(saveTimer);
            room.close();
            rooms.delete(roomId);
          })
          .catch(console.error);
      }
    },
  });

  rooms.set(roomId, room);
  return room;
}

const app = fastify();
app.register(websocketPlugin);
app.register(cors, { origin: '*' });

app.register(async (app) => {
  // Main tldraw sync WebSocket endpoint
  app.get(
    '/connect/:roomId',
    { websocket: true },
    async (socket, req) => {
      const roomId = (req.params as Record<string, string>).roomId;
      const sessionId = (req.query as Record<string, string>)?.sessionId;

      // Buffer messages that arrive before the room is ready
      const caughtMessages: RawData[] = [];
      const collectMessages = (msg: RawData) => caughtMessages.push(msg);
      socket.on('message', collectMessages);

      const room = await makeOrLoadRoom(roomId);
      room.handleSocketConnect({ sessionId, socket });

      socket.off('message', collectMessages);
      for (const msg of caughtMessages) {
        socket.emit('message', msg);
      }

      console.log(
        `[tldraw] Client connected: ${sessionId} (room: ${roomId})`
      );
    }
  );
});

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`🚀 tldraw sync server listening on port ${PORT}`);
});
