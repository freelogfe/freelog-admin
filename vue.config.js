module.exports = {
  devServer: {
    open: true,
    proxy: {
      "/api": {
        target: process.env.VUE_APP_BASE_API,
        pathRewrite: {
          "^/api": process.env.VUE_APP_BASE_API,
        },
      },
    },
  },
};
