// Metro config: Expo defaults plus a development-only proxy to the RagaKu backend.
//
// Why: a phone running Expo Go already reaches this computer on Metro's port (8081), but
// Windows Firewall often blocks other inbound ports on "Public" networks (campus Wi-Fi,
// phone hotspot), so the backend on port 8000 is unreachable from the phone. Routing the
// API through Metro avoids opening any extra port. The app uses this path automatically
// when it runs in Expo Go (see `resolveBaseUrl` in src/lib/api.ts); a release build never
// does, because there is no dev server host.
const http = require('http');
const { getDefaultConfig } = require('expo/metro-config');

const PROXY_PREFIX = '/ragaku-api';
const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = Number(process.env.RAGAKU_BACKEND_PORT) || 8000;

function proxyToBackend(req, res) {
  const upstream = http.request(
    {
      host: BACKEND_HOST,
      port: BACKEND_PORT,
      method: req.method,
      path: req.url.slice(PROXY_PREFIX.length) || '/',
      headers: { ...req.headers, host: `${BACKEND_HOST}:${BACKEND_PORT}` },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on('error', () => {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        detail: `Backend RagaKu tidak berjalan di port ${BACKEND_PORT} pada komputer ini.`,
      }),
    );
  });
  req.pipe(upstream);
}

const config = getDefaultConfig(__dirname);

const previousEnhance = config.server && config.server.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware, server) => {
    const base = previousEnhance ? previousEnhance(metroMiddleware, server) : metroMiddleware;
    return (req, res, next) => {
      if (req.url && req.url.startsWith(PROXY_PREFIX + '/')) {
        proxyToBackend(req, res);
        return;
      }
      return base(req, res, next);
    };
  },
};

module.exports = config;
