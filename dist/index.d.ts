import { Application } from "express";
import { DynamicProxyOptions } from "./proxy";
export declare function useProxy(app: Application, options?: DynamicProxyOptions | string): void;
