module.exports = {
  apps: [
    {
      name: "edupaleu-application-portal",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "production",
        ENV_VAR1: "environment-variable",
      },
    },
  ],
};
