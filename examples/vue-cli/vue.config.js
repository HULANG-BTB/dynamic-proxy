const { useProxy } = require('dynamic-proxy')

module.exports = {
    devServer: {
        after(app) {
            useProxy(app)
        }
    }
}