"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicProxy = void 0;
var chokidar_1 = __importDefault(require("chokidar"));
var path_1 = __importDefault(require("path"));
var chalk_1 = __importDefault(require("chalk"));
var fs_1 = __importDefault(require("fs"));
var http_proxy_middleware_1 = require("http-proxy-middleware");
var DynamicProxy = /** @class */ (function () {
    function DynamicProxy(app, options) {
        var _this = this;
        var _a;
        this.proxyStartIndex = 0;
        this.proxyEndIndex = 0;
        this.proxyLength = 0;
        this.watchFile = [];
        this.app = app;
        this.proxyFile = (_a = options === null || options === void 0 ? void 0 : options.proxyFile) !== null && _a !== void 0 ? _a : path_1.default.join(process.cwd(), "proxy.js");
        if (options && Array.isArray(options.watch)) {
            options.watch.forEach(function (file) {
                _this.watchFile.push(file);
            });
        }
        this.watchFile.push(this.proxyFile);
    }
    DynamicProxy.prototype.registerRoutes = function () {
        var _this = this;
        if (!fs_1.default.existsSync(this.proxyFile)) {
            return;
        }
        var localProxy = require(this.proxyFile);
        Object.entries(localProxy).forEach(function (_a) {
            var path = _a[0], options = _a[1];
            _this.app.use(http_proxy_middleware_1.createProxyMiddleware(path, __assign(__assign({}, options), { logLevel: "silent" })));
            _this.proxyEndIndex = _this.app._router.stack.length;
        });
        this.proxyLength = Object.keys(localProxy).length;
        this.proxyStartIndex = this.proxyEndIndex - this.proxyLength;
    };
    DynamicProxy.prototype.unregisterRoutes = function () {
        // remove middleware
        this.app._router.stack.splice(this.proxyStartIndex, this.proxyEndIndex);
        // clean cache
        this.watchFile.forEach(function (watchFile) {
            Object.keys(require.cache).forEach(function (i) {
                if (i.includes(watchFile)) {
                    delete require.cache[require.resolve(i)];
                }
            });
        });
    };
    DynamicProxy.prototype.start = function () {
        var _this = this;
        this.registerRoutes();
        chokidar_1.default.watch(this.watchFile).on("all", function (event, path) {
            if (event === "change" || event === "add") {
                try {
                    _this.unregisterRoutes();
                    _this.registerRoutes();
                    console.log(chalk_1.default.magentaBright("\n > Proxy Server hot reload success! changed  " + path));
                }
                catch (error) {
                    console.log(chalk_1.default.redBright(error));
                }
            }
        });
    };
    return DynamicProxy;
}());
exports.DynamicProxy = DynamicProxy;
