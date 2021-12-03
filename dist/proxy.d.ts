import { Application } from "express";
import { Options } from "http-proxy-middleware";
export interface ProxyOptions {
    [key: string]: Options;
}
export interface DynamicProxyOptions {
    proxyFile?: string;
    watch?: string[];
}
export declare class DynamicProxy {
    private proxyStartIndex;
    private proxyEndIndex;
    private proxyLength;
    private app;
    private proxyFile;
    private watchFile;
    constructor(app: Application, options?: DynamicProxyOptions);
    registerRoutes(): void;
    unregisterRoutes(): void;
    start(): void;
}
