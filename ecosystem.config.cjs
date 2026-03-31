module.exports = {
  apps: [
    {
      name: "x-wrike-3008",
      cwd: "/root/Gad/web/Apps/x-wrike",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3008",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
