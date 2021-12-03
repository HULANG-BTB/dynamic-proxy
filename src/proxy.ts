import { Application } from "express";
import chokidar from "chokidar";
import path from "path";
import chalk from "chalk";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

export interface ProxyOptions {
  [key: string]: Options;
}

export interface DynamicProxyOptions {
  proxyFile?: string;
  watch?: string[];
}
export class DynamicProxy {
  private proxyStartIndex: number;
  private proxyEndIndex: number;
  private proxyLength: number;
  private app: Application;
  private proxyFile: string;
  private watchFile: string[];

  constructor(app: Application, options?: DynamicProxyOptions) {
    this.proxyStartIndex = 0;
    this.proxyEndIndex = 0;
    this.proxyLength = 0;
    this.watchFile = [];
    this.app = app;
    this.proxyFile = options?.proxyFile ?? path.join(process.cwd(), "proxy.js");
    if (options && Array.isArray(options.watch)) {
      options.watch.forEach((file) => {
        this.watchFile.push(file);
      });
    }
    this.watchFile.push(this.proxyFile);
  }

  registerRoutes() {
    const localProxy: ProxyOptions = require(this.proxyFile);
    Object.entries(localProxy).forEach(([path, options]) => {
      this.app.use(createProxyMiddleware(path, { ...options, logLevel: "silent" }));
      this.proxyEndIndex = this.app._router.stack.length;
    });
    this.proxyLength = Object.keys(localProxy).length;
    this.proxyStartIndex = this.proxyEndIndex - this.proxyLength;
  }

  unregisterRoutes() {
    // remove middleware
    this.app._router.stack.splice(this.proxyStartIndex, this.proxyEndIndex);
    // clean cache
    this.watchFile.forEach((watchFile) => {
      Object.keys(require.cache).forEach((i) => {
        if (i.includes(watchFile)) {
          delete require.cache[require.resolve(i)];
        }
      });
    });
  }

  start() {
    this.registerRoutes();
    chokidar.watch(this.watchFile).on("all", (event, path) => {
      if (event === "change" || event === "add") {
        try {
          this.unregisterRoutes();
          this.registerRoutes();
          console.log(chalk.magentaBright(`\n > Proxy Server hot reload success! changed  ${path}`));
        } catch (error: any) {
          console.log(chalk.redBright(error));
        }
      }
    });
  }
}
