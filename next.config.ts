import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' 
                https://*.pusher.com 
                https://images.unsplash.com
                https://teams.microsoft.com 
                https://www.google.com 
                https://www.gstatic.com 
                https://consent.cookiebot.com;
                https://consentcdn.cookiebot.com
              connect-src 'self' 
                https://*.pusher.com 
                wss://*.pusher.com 
                https://teams.microsoft.com 
                https://www.google.com 
                https://www.gstatic.com 
                https://ipwho.is;
              frame-src 'self' 
                https://teams.microsoft.com 
                https://www.google.com;
              style-src 'self' 'unsafe-inline' 
                https://teams.microsoft.com 
                https://www.google.com;
              img-src 'self' data: 
                https://www.gstatic.com;
            `.replace(/\s{2,}/g, " "), // Minify CSP string
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "https://teams.microsoft.com",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
