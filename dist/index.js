"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProxy = void 0;
var proxy_1 = require("./proxy");
function useProxy(app, options) {
    var config = {};
    if (typeof options === "string") {
        config.file = options;
    }
    else if (options) {
        config = options;
    }
    var proxy = new proxy_1.DynamicProxy(app, config);
    proxy.start();
}
exports.useProxy = useProxy;
