"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProxy = void 0;
var proxy_1 = require("./proxy");
function useProxy(app, file) {
    var proxy = new proxy_1.DynamicProxy(app, file);
    proxy.start();
}
exports.useProxy = useProxy;
