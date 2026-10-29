import type { IncomingMessage, ServerResponse } from 'http';
import { handleChatRequest } from './gemini.js';

export function setupApiRoutes(req: IncomingMessage, res: ServerResponse): boolean {
  const url = req.url?.split('?')[0];

  if (url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = await handleChatRequest({
          messages: payload.messages || [],
          userLocation: payload.userLocation,
          mapCenter: payload.mapCenter,
          systemRole: payload.systemRole,
          model: payload.model,
        });

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(result));
      } catch (error: any) {
        console.error('API /api/chat error:', error);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            error: error.message || 'Internal server error while processing Gemini chat.',
          })
        );
      }
    });

    return true;
  }

  // Server health check
  if (url === '/api/health' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) }));
    return true;
  }

  return false;
}
