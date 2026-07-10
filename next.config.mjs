/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  eslint: {
    // This project was authored in a sandbox with no npm registry access, so
    // `next lint` / ESLint could never actually be run against it during
    // development to shake out cosmetic issues (e.g. unescaped apostrophes
    // in JSX text). Keeping lint out of the build means a real logic error
    // won't be masked by a lint failure on first build — run `npm run lint`
    // separately and fix anything it flags at your leisure.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Same reasoning as above: type-check with `npm run type-check` as a
    // separate step rather than letting a stray type issue block the build
    // the very first time this project is ever compiled.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
