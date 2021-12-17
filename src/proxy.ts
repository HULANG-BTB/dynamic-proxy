import { Application } from "express";
import chokidar from "chokidar";
import path from "path";
import chalk from "chalk";
import fs from "fs";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

export interface ProxyOptions {
  [key: string]: Options;
}

export interface DynamicProxyOptions {
  proxyFile?: string;
  watch?: string[];
  options?: Options;
}
export class DynamicProxy {
  private proxyStartIndex: number;
  private proxyEndIndex: number;
  private proxyLength: number;
  private app: Application;
  private proxyFile: string;
  private watchFile: Set<string>;

  constructor(app: Application, options?: DynamicProxyOptions) {
    this.proxyStartIndex = 0;
    this.proxyEndIndex = 0;
    this.proxyLength = 0;
    this.watchFile = new Set<string>();
    this.app = app;
    this.proxyFile = options?.proxyFile ?? path.join(process.cwd(), "proxy.js");
    if (options && Array.isArray(options.watch)) {
      options.watch.forEach((file) => {
        this.watchFile.add(file);
      });
    }
    this.watchFile.add(this.proxyFile);
  }

  collectDeps() {
    require(this.proxyFile);
    const walkDeps = (modules: NodeModule[]) => {
      modules.forEach((md) => {
        this.watchFile.add(md.id);
        if (md.children.length) {
          walkDeps(md.children);
        }
      });
    };
    walkDeps(require.cache[this.proxyFile]?.children || []);
  }

  createOptions(customOptions: Options): Options {
    const options: Options = {
      logLevel: "silent",
    };
    return Object.assign({}, options, customOptions);
  }

  registerRoutes() {
    if (!fs.existsSync(this.proxyFile)) {
      console.log(chalk.redBright(`The proxy file at \`${this.proxyFile}\` is not found.`));
      return;
    }
    // recollect dep files before registe routes
    this.collectDeps();
    const localProxy: ProxyOptions = require(this.proxyFile);
    Object.entries(localProxy).forEach(([context, customOptions]) => {
      const options = this.createOptions(customOptions);
      this.app.use(createProxyMiddleware(context, options));
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
    chokidar.watch(Array.from(this.watchFile.values())).on("all", (event, path) => {
      if (event === "change" || event === "add") {
        try {
          this.unregisterRoutes();
          this.registerRoutes();
          console.log(chalk.magentaBright(`\n > Proxy Server hot reload success! ${event}  ${path}`));
        } catch (error: any) {
          console.log(chalk.redBright(error));
        }
      }
    });
  }
}
