import { Application } from "express";
import { DynamicProxy, DynamicProxyOptions } from "./proxy";

export function useProxy(app: Application, options?: DynamicProxyOptions | string) {
  let config: DynamicProxyOptions = {};
  if (typeof options === "string") {
    config.proxyFile = options;
  } else if (options) {
    config = options;
  }
  const proxy = new DynamicProxy(app, config);
  proxy.start();
}
