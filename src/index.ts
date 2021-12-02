import { Application } from "express";
import { DynamicProxy } from "./proxy";

export function useProxy(app: Application, file: string | undefined) {
  const proxy = new DynamicProxy(app, file);
  proxy.start();
}
