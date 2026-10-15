const csp = [
  "default-src 'self'", "img-src 'self' data:", "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"),
  "connect-src 'self'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'",
].join('; ');
/** @type {import('next').NextConfig} */
export default {
  serverExternalPackages: ['@electric-sql/pglite'],
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'same-origin' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
    ] }];
  },
};
