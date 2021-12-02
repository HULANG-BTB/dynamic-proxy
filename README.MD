## DynamicProxy

> This is a tool to help webpack or vue-cli to enable proxy hot reload.

## Install

### npm:

```sh
npm install dynamic-proxy --save-dev
```

### yarn

```sh
yarn add dynamic-proxy -D
```

## Example

### 1、Proxy File

Create a proxy file or use default `proxy.js` in your root dir.

The file content like this:

```javascript
module.exports = {
  '/api': {
    ws: true,
    changeOrigin: true,
    target: 'http://127.0.0.1:8888'
  }
}
```

### 2、Use Proxy

`vue.config.js` or `webpack.config.js`

```javascript
  // ...
  const { useProxy } = require('dynamic-proxy')
  
  module.exports = {
      // ...
      devServer: {
          // ... 
          after(app) {
              useProxy(app)
          }
      }
  }
```

