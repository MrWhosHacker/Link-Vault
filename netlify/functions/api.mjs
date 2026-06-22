import { getStore } from '@netlify/blobs';
import { createApiHandler, EMPTY_DB } from '../../server/dbApi.js';

const DB_KEY = 'main';

function createBlobStorage() {
  const store = getStore('linkvault-db');
  return {
    async loadDb() {
      try {
        const data = await store.get(DB_KEY, { type: 'json' });
        return data ?? structuredClone(EMPTY_DB);
      } catch {
        return structuredClone(EMPTY_DB);
      }
    },
    async saveDb(db) {
      await store.setJSON(DB_KEY, db);
    },
  };
}

const handleApi = createApiHandler(createBlobStorage());

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  let body = null;
  if (req.method !== 'GET') {
    try {
      body = await req.json();
    } catch {
      body = null;
    }
  }

  const url = new URL(req.url);
  const { status, body: payload } = await handleApi(req.method, url.pathname, body);

  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
