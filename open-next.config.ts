const config = {
  default: {
    override: {
      wrapper: 'cloudflare',
      converter: 'edge',
      generateDockerfile: false,
    },
  },
  buildCommand: 'npm run build:next',
};

export default config;
