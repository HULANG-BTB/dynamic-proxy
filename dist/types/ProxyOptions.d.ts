import { Options } from "http-proxy-middleware";
export interface ProxyOptions {
    [key: string]: Options;
}
