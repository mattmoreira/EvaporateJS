declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;
declare namespace $_$twiz {
    function track<T>(value: T, filename: string, offset: number): T;
    function track(value: any, filename: string, offset: number): any;
}
import { CancelableS3AWSRequest } from "./CancelableS3AWSRequest";
import { Global } from "./Global";
class SignedS3AWSRequestWithRetryLimit extends CancelableS3AWSRequest {
    public maxRetries: any;
    constructor(fileUpload, request?: any, maxRetries?: number) {
        super(fileUpload, request);
        if (maxRetries > -1) {
            this.maxRetries = maxRetries;
        }
    }
    errorHandler(reason) { $_$twiz("reason", reason, 393, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequestWithRetryLimit.ts", "{}"); if (this.attempts > this.maxRetries) {
        const msg = [
            "MaxRetries exceeded. Will re-upload file id ",
            this.fileUpload.id,
            ", ",
            reason
        ].join("");
        Global.l.w(msg);
        this.awsDeferred.reject(msg);
        return true;
    } }
    rejectedSuccess(...args) {
        $_$twiz("args", args, 706, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequestWithRetryLimit.ts", "{}");
        const reason = Array.prototype.slice.call(args, 1).join("");
        this.awsDeferred.reject(reason);
        return false;
    }
}
SignedS3AWSRequestWithRetryLimit.prototype.maxRetries = 1;
export { SignedS3AWSRequestWithRetryLimit };
