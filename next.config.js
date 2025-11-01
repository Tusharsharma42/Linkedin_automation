/** @type {import('next').NextConfig} */
const nextConfig = {
  // Custom webpack configuration to handle server-side dependencies in the client build.
  // This is necessary because google-auth-library attempts to import 'child_process'
  // which is a Node.js built-in module not available on the client.
  webpack: (config, { isServer }) => {
    // We only want to apply this configuration to the client-side build.
    if (!isServer) {
      // This is a more aggressive fix. We are telling webpack to
      // ignore the entire `google-cloud/storage` package when building
      // for the browser, as it's a server-only library.
      config.externals.push({
        'google-cloud/storage': 'google-cloud/storage'
      });
    }

    return config;
  },
};

export default nextConfig;
