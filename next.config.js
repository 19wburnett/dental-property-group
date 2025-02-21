/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['wuisbxbfwwpmuamycjpv.supabase.co'], // Add your image domains here
  },
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: 'https://wuisbxbfwwpmuamycjpv.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your-supabase-anon-key',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        ],
      },
    ];
  }
};

module.exports = nextConfig