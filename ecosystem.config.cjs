module.exports = {
  apps: [
    {
      name: "xmanager-3008",
      cwd: "/root/Gad/web/Apps/xmanager",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3008",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        APP_ENV: "production",
        APP_BASE_PATH: "",
        NEXT_PUBLIC_APP_ENV: "production",
        NEXT_PUBLIC_APP_BASE_PATH: "",
      },
    },
    {
      name: "xmanager-dev-3018",
      cwd: "/root/Gad/web/Apps/xmanager",
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 3018 --hostname 127.0.0.1",
      interpreter: "node",
      env: {
        NODE_ENV: "development",
        APP_ENV: "development",
        APP_BASE_PATH: "/xmanager",
        NEXT_PUBLIC_APP_ENV: "development",
        NEXT_PUBLIC_APP_BASE_PATH: "/xmanager",
      },
    },
  ],
};
