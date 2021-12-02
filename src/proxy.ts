import { Application } from "express";
import chokidar from "chokidar";
import path from "path";
import chalk from "chalk";
import { createProxyMiddleware } from "http-proxy-middleware";
import { ProxyOptions } from "types/ProxyOptions";

export class DynamicProxy {
  private proxyStartIndex: number;
  private proxyEndIndex: number;
  private proxyLength: number;
  private app: Application;
  private proxyFile: string;

  constructor(app: Application, proxyFile: string | undefined) {
    this.proxyStartIndex = 0;
    this.proxyEndIndex = 0;
    this.proxyLength = 0;
    this.app = app;
    this.proxyFile = proxyFile || path.join(process.cwd(), "proxy.js");
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
    Object.keys(require.cache).forEach((i) => {
      if (i.includes(this.proxyFile)) {
        delete require.cache[require.resolve(i)];
      }
    });
  }

  start() {
    this.registerRoutes();
    chokidar.watch(this.proxyFile).on("all", (event, path) => {
      if (event === "change" || event === "add") {
        try {
          this.unregisterRoutes();
          this.registerRoutes();
          console.log(chalk.magentaBright(`\n > Proxy Server hot reload success! changed  ${path}`));
        } catch (error) {
          console.log(chalk.redBright(error));
        }
      }
    });
  }
}
