import { Application } from "express";
import { Options } from "http-proxy-middleware";
export interface ProxyOptions {
    [key: string]: Options;
}
export interface DynamicProxyOptions {
    proxyFile?: string;
    watch?: string[];
    options?: Options;
}
export declare class DynamicProxy {
    private proxyMiddlewareStartIndex;
    private proxyMiddlewareEndIndex;
    private proxyMiddlewareLength;
    private app;
    private proxyFile;
    private watchFile;
    private watcher;
    constructor(app: Application, options?: DynamicProxyOptions);
    collectDeps(): Set<string>;
    createOptions(customOptions: Options): Options;
    registerRoutes(): void;
    unregisterRoutes(): void;
    start(): void;
    reload(): void;
}
