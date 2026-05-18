import 'dotenv/config';
import { Server } from '@hocuspocus/server';
import { Redis } from '@hocuspocus/extension-redis';
import { Database } from '@hocuspocus/extension-database';
import { createClient } from '@supabase/supabase-js';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 1234;

// 1. Supabase Initialization (Persistence)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const extensions = [];

if (supabase) {
  extensions.push(
    new Database({
      fetch: async ({ documentName }) => {
        const { data, error } = await supabase
          .from('documents')
          .select('state')
          .eq('name', documentName)
          .single();
        if (data?.state) {
          return Buffer.from(data.state, 'base64');
        }
        return null;
      },
      store: async ({ documentName, state }) => {
        await supabase
          .from('documents')
          .upsert({ name: documentName, state: Buffer.from(state).toString('base64') });
      },
    })
  );
  console.log('[Hocuspocus] Supabase Database extension loaded');
}

// 2. Redis Initialization (Horizontal Scaling / Cache)
if (process.env.REDIS_URL) {
  try {
    const redisUrl = new URL(process.env.REDIS_URL);
    extensions.push(
      new Redis({
        host: redisUrl.hostname,
        port: parseInt(redisUrl.port, 10) || 6379,
        options: {
          password: redisUrl.password,
          tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
        }
      })
    );
    console.log('[Hocuspocus] Redis extension loaded via URL');
  } catch (err) {
    console.error('[Hocuspocus] Failed to parse REDIS_URL', err);
  }
}

// 3. Configure and Start Server
const server = new Server({
  port,
  extensions,
  async onConnect(data) {
    console.log(`[Hocuspocus] Client connected to document: ${data.documentName}`);
  },
  async onDisconnect(data) {
    console.log(`[Hocuspocus] Client disconnected from document: ${data.documentName}`);
  }
});

server.listen();
console.log(`🚀 Hocuspocus sync server listening on port ${port}`);
