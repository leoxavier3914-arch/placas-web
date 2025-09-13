/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_TOKEN: process.env.API_TOKEN,
  },
};
export default nextConfig;
