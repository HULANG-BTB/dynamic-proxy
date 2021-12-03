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
  "/api": {
    ws: true,
    changeOrigin: true,
    target: "http://127.0.0.1:8888",
  },
};
```

### 2、Use Proxy

`vue.config.js` or `webpack.config.js`

- For `webpack-dev-server v3` or vue/cli

  ```javascript
  // ...
  const { useProxy } = require("dynamic-proxy");

  module.exports = {
    // ...
    devServer: {
      // ...
      after(app) {
        useProxy(app); // or useProxy(app, options)
      },
    },
  };
  ```

- For `webpack-dev-server v4`

  ```javascript
  const { useProxy } = require("dynamic-proxy");

  module.exports = {
    devServer: {
      onAfterSetupMiddleware: function (devServer) {
        useProxy(devServer.app);
      },
    },
  };
  ```

### Custom options

- Options can be a `string` to declare the proxy file where is.

  ```javascript
  // ...
  const filename = path.join(__dirname, "custom.proxy.js");

  module.exports = {
    // ...
    devServer: {
      // ...
      after(app) {
        useProxy(app, filename);
      },
    },
  };
  ```

- Options also can be a `object` with `proxyFile` and `watchFiles`.

  ```javascript
  // ...

  const options = {
    proxyFile: path.join(__dirname, "custom.proxy.js"),
    watch: [
      // someother file's path like `proxyFile` field.
      // proxy server will reload when these files changed
    ],
  };

  module.exports = {
    // ...
    devServer: {
      // ...
      after(app) {
        useProxy(app, options);
      },
    },
  };
  ```
