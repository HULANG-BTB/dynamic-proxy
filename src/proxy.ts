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
  private proxyMiddlewareStartIndex: number;
  private proxyMiddlewareEndIndex: number;
  private proxyMiddlewareLength: number;
  private app: Application;
  private proxyFile: string;
  private watchFile: Set<string>;
  private watcher: chokidar.FSWatcher;

  constructor(app: Application, options?: DynamicProxyOptions) {
    this.proxyMiddlewareStartIndex = 0;
    this.proxyMiddlewareEndIndex = 0;
    this.proxyMiddlewareLength = 0;
    this.watchFile = new Set<string>();
    this.app = app;
    this.proxyFile = options?.proxyFile ?? path.join(process.cwd(), "proxy.js");
    if (options && Array.isArray(options.watch)) {
      options.watch.forEach((file) => {
        this.watchFile.add(file);
      });
    }
    this.watchFile = this.collectDeps();
    this.watcher = chokidar.watch(Array.from(this.watchFile.values()));
  }

  collectDeps(): Set<string> {
    if (!fs.existsSync(this.proxyFile)) {
      console.log(chalk.redBright(`The proxy file at \`${this.proxyFile}\` is not found.`));
      return new Set<string>([]);
    }
    const deps: Set<string> = new Set<string>([this.proxyFile]);
    require(this.proxyFile);
    const walkDeps = (modules: NodeModule[]) => {
      modules.forEach((md) => {
        deps.add(md.id);
        if (md.children.length) {
          walkDeps(md.children);
        }
      });
    };
    walkDeps(require.cache[this.proxyFile]?.children || []);
    return deps;
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
    const localProxy: ProxyOptions = require(this.proxyFile);
    Object.entries(localProxy).forEach(([context, customOptions]) => {
      const options = this.createOptions(customOptions);
      this.app.use(createProxyMiddleware(context, options));
      this.proxyMiddlewareEndIndex = this.app._router.stack.length;
    });
    this.proxyMiddlewareLength = Object.keys(localProxy).length;
    this.proxyMiddlewareStartIndex = this.proxyMiddlewareEndIndex - this.proxyMiddlewareLength;
  }

  unregisterRoutes() {
    // remove middleware
    this.app._router.stack.splice(this.proxyMiddlewareStartIndex, this.proxyMiddlewareEndIndex);
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
    this.watcher.on("all", (event, path) => {
      if (event === "change" || event === "add" || event === "unlink") {
        try {
          this.unregisterRoutes();
          this.reload();
          this.registerRoutes();
          console.log(chalk.magentaBright(`\n > Proxy Server hot reload success! ${event}  ${path}`));
        } catch (error: any) {
          console.log(chalk.redBright(error));
        }
      }
    });
  }

  reload() {
    // recollect deps
    const newDeps = this.collectDeps();
    // delete watch not in dep
    Array.from(this.watchFile.values()).forEach((id) => {
      if (!newDeps.has(id)) {
        this.watchFile.delete(id);
      }
    });
    // add watch file in new dep
    Array.from(newDeps.values()).forEach((id) => {
      if (!this.watchFile.has(id)) {
        this.watcher.add(id);
      }
    });
  }
}
