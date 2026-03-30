import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import apiApp from './hono';

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

console.log(`Heinicus API listening on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
