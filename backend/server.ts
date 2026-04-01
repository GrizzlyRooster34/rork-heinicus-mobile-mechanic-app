import { getRequestListener } from '@hono/node-server';
import { createServer } from 'node:http';
import { Hono } from 'hono';
import apiApp from './hono';
import { createRealtimeServer } from './websocket/server';

const app = new Hono();

app.route('/api', apiApp);

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Heinicus backend server is running',
    apiBasePath: '/api',
    timestamp: new Date().toISOString(),
  });
});

const port = Number(process.env.PORT || 3000);
const requestListener = getRequestListener(app.fetch);
const server = createServer(requestListener);

createRealtimeServer(server);

server.listen(port, () => {
  console.log(`Heinicus API listening on http://localhost:${port}`);
  console.log(`Heinicus realtime server ready on ws://localhost:${port}`);
});
