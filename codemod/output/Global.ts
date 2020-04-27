declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;
declare namespace $_$twiz {
    function track<T>(value: T, filename: string, offset: number): T;
    function track(value: any, filename: string, offset: number): any;
}
import { noOpLogger } from "./Utils";
type Global = {
    HOURS_AGO: Date;
    historyCache: any;
    l: any;
};
const Global = {} as Global;
Global.l = noOpLogger();
Global.HOURS_AGO = null;
Global.historyCache = null;
export { Global };
