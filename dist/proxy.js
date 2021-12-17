"use strict";
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
        this.watchFile = new Set();
        this.app = app;
        this.proxyFile = (_a = options === null || options === void 0 ? void 0 : options.proxyFile) !== null && _a !== void 0 ? _a : path_1.default.join(process.cwd(), "proxy.js");
        if (options && Array.isArray(options.watch)) {
            options.watch.forEach(function (file) {
                _this.watchFile.add(file);
            });
        }
        this.watchFile.add(this.proxyFile);
    }
    DynamicProxy.prototype.collectDeps = function () {
        var _this = this;
        var _a;
        require(this.proxyFile);
        var walkDeps = function (modules) {
            modules.forEach(function (md) {
                _this.watchFile.add(md.id);
                if (md.children.length) {
                    walkDeps(md.children);
                }
            });
        };
        walkDeps(((_a = require.cache[this.proxyFile]) === null || _a === void 0 ? void 0 : _a.children) || []);
    };
    DynamicProxy.prototype.createOptions = function (customOptions) {
        var options = {
            logLevel: "silent",
        };
        return Object.assign({}, options, customOptions);
    };
    DynamicProxy.prototype.registerRoutes = function () {
        var _this = this;
        if (!fs_1.default.existsSync(this.proxyFile)) {
            console.log(chalk_1.default.redBright("The proxy file at `".concat(this.proxyFile, "` is not found.")));
            return;
        }
        // recollect dep files before registe routes
        this.collectDeps();
        var localProxy = require(this.proxyFile);
        Object.entries(localProxy).forEach(function (_a) {
            var context = _a[0], customOptions = _a[1];
            var options = _this.createOptions(customOptions);
            _this.app.use((0, http_proxy_middleware_1.createProxyMiddleware)(context, options));
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
        chokidar_1.default.watch(Array.from(this.watchFile.values())).on("all", function (event, path) {
            if (event === "change" || event === "add") {
                try {
                    _this.unregisterRoutes();
                    _this.registerRoutes();
                    console.log(chalk_1.default.magentaBright("\n > Proxy Server hot reload success! ".concat(event, "  ").concat(path)));
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
