const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: process.env.BACK_PORT ? Number(process.env.BACK_PORT) : 5000,
    allowedHosts: 'all',
    host: '0.0.0.0'
  }
})
