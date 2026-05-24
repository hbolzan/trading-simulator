import { startSessionApiServer } from './adapters/inbound/http/session-api-server.js';

const port = Number(Deno.env.get('API_PORT') ?? '8787');
startSessionApiServer({ port });
