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
        var _a, _b;
        this.proxyMiddlewareStartIndex = 0;
        this.proxyMiddlewareEndIndex = 0;
        this.proxyMiddlewareLength = 0;
        this.watchFile = new Set();
        this.app = app;
        this.file = (_b = (_a = options === null || options === void 0 ? void 0 : options.file) !== null && _a !== void 0 ? _a : options === null || options === void 0 ? void 0 : options.proxyFile) !== null && _b !== void 0 ? _b : path_1.default.join(process.cwd(), "proxy.js");
        if (options === null || options === void 0 ? void 0 : options.proxyFile) {
            console.warn('field `proxyFile` is deprecated and will be remove in the feature, please use `file` to replace。');
        }
        if (options && Array.isArray(options.watch)) {
            options.watch.forEach(function (file) {
                _this.watchFile.add(file);
            });
        }
        this.watchFile = this.collectDeps();
        this.watcher = chokidar_1.default.watch(Array.from(this.watchFile.values()));
    }
    DynamicProxy.prototype.collectDeps = function () {
        var _a;
        if (!fs_1.default.existsSync(this.file)) {
            console.log(chalk_1.default.redBright("The proxy file at `".concat(this.file, "` is not found.")));
            return new Set([]);
        }
        var deps = new Set([this.file]);
        require(this.file);
        var walkDeps = function (modules) {
            modules.forEach(function (md) {
                deps.add(md.id);
                if (md.children.length) {
                    walkDeps(md.children);
                }
            });
        };
        walkDeps(((_a = require.cache[this.file]) === null || _a === void 0 ? void 0 : _a.children) || []);
        return deps;
    };
    DynamicProxy.prototype.createOptions = function (customOptions) {
        var options = {
            logLevel: "silent",
        };
        return Object.assign({}, options, customOptions);
    };
    DynamicProxy.prototype.registerRoutes = function () {
        var _this = this;
        if (!fs_1.default.existsSync(this.file)) {
            console.log(chalk_1.default.redBright("The proxy file at `".concat(this.file, "` is not found.")));
            return;
        }
        var localProxy = require(this.file);
        Object.entries(localProxy).forEach(function (_a) {
            var context = _a[0], customOptions = _a[1];
            var options = _this.createOptions(customOptions);
            _this.app.use((0, http_proxy_middleware_1.createProxyMiddleware)(context, options));
            _this.proxyMiddlewareEndIndex = _this.app._router.stack.length;
        });
        this.proxyMiddlewareLength = Object.keys(localProxy).length;
        this.proxyMiddlewareStartIndex = this.proxyMiddlewareEndIndex - this.proxyMiddlewareLength;
    };
    DynamicProxy.prototype.unregisterRoutes = function () {
        // remove middleware
        this.app._router.stack.splice(this.proxyMiddlewareStartIndex, this.proxyMiddlewareEndIndex);
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
        this.watcher.on("all", function (event, path) {
            if (event === "change" || event === "add" || event === "unlink") {
                try {
                    _this.unregisterRoutes();
                    _this.reload();
                    _this.registerRoutes();
                    console.log(chalk_1.default.magentaBright("\n > Proxy Server hot reload success! ".concat(event, "  ").concat(path)));
                }
                catch (error) {
                    console.log(chalk_1.default.redBright(error));
                }
            }
        });
    };
    DynamicProxy.prototype.reload = function () {
        var _this = this;
        // recollect deps
        var newDeps = this.collectDeps();
        // delete watch not in dep
        Array.from(this.watchFile.values()).forEach(function (id) {
            if (!newDeps.has(id)) {
                _this.watchFile.delete(id);
            }
        });
        // add watch file in new dep
        Array.from(newDeps.values()).forEach(function (id) {
            if (!_this.watchFile.has(id)) {
                _this.watcher.add(id);
            }
        });
    };
    return DynamicProxy;
}());
exports.DynamicProxy = DynamicProxy;
