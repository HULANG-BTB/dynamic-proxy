import { Application } from "express";
export declare class DynamicProxy {
    private proxyStartIndex;
    private proxyEndIndex;
    private proxyLength;
    private app;
    private proxyFile;
    constructor(app: Application, proxyFile: string | undefined);
    registerRoutes(): void;
    unregisterRoutes(): void;
    start(): void;
}
