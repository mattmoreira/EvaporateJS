declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;
declare namespace $_$twiz {
    function track<T>(value: T, filename: string, offset: number): T;
    function track(value: any, filename: string, offset: number): any;
}
import { SignedS3AWSRequest } from "./SignedS3AWSRequest";
class AuthorizationMethod {
    fileUpload: any;
    awsRequest: SignedS3AWSRequest;
    request: any;
    con: any;
    static makeSignParamsObject(signParams: any): any { throw new Error("Method not implemented."); }
    constructor(awsRequest: SignedS3AWSRequest) {
        this.awsRequest = awsRequest;
        this.request = awsRequest.request;
        this.fileUpload = awsRequest.fileUpload;
        this.con = this.fileUpload.con;
    }
    getBaseUrl(stringToSign) {
        $_$twiz("stringToSign", stringToSign, 508, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/AuthorizationMethod.ts", "{}");
        const url = [
            this.con.signerUrl,
            "?to_sign=",
            stringToSign,
            "&datetime=",
            this.request.dateString
        ];
        if (this.con.sendCanonicalRequestToSignerUrl) {
            url.push("&canonical_request=");
            url.push(encodeURIComponent(this.awsRequest.canonicalRequest()));
        }
        return url.join("");
    }
    authorize() { return new Promise((resolve, reject) => {
        $_$twiz("resolve", resolve, 900, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/AuthorizationMethod.ts", "{\"arrow\":true}");
        $_$twiz("reject", reject, 908, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/AuthorizationMethod.ts", "{\"arrow\":true}");
        const xhr = new XMLHttpRequest();
        this.awsRequest.currentXhr = xhr;
        const stringToSign = this.awsRequest.stringToSign();
        let url = this.getBaseUrl(stringToSign);
        const signParams = AuthorizationMethod.makeSignParamsObject(this.fileUpload.signParams);
        for (const param in signParams) {
            if (!signParams.hasOwnProperty(param)) {
                continue;
            }
            url += `&${encodeURIComponent(param)}=${encodeURIComponent(signParams[param])}`;
        }
        if (this.con.xhrWithCredentials) {
            xhr.withCredentials = true;
        }
        xhr.onreadystatechange = () => { if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                this.awsRequest
                    .signResponse(xhr.response, stringToSign, this.request.dateString)
                    .then(resolve);
            }
            else {
                if ([401, 403].includes(xhr.status)) {
                    const reason = `status:${xhr.status}`;
                    this.fileUpload.deferredCompletion.reject(`Permission denied ${reason}`);
                    return reject(reason);
                }
                reject(`Signature fetch returned status: ${xhr.status}`);
            }
        } };
        xhr.onerror = ev => { $_$twiz("ev", ev, 2208, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/AuthorizationMethod.ts", "{\"arrow\":true,\"parens\":[2206,2208]}"); reject(`authorizedSend transport error: ${xhr.responseText}`); };
        xhr.open("GET", url);
        const signHeaders = AuthorizationMethod.makeSignParamsObject(this.con.signHeaders);
        for (const header in signHeaders) {
            if (!signHeaders.hasOwnProperty(header)) {
                continue;
            }
            xhr.setRequestHeader(header, signHeaders[header]);
        }
        if (typeof this.fileUpload.beforeSigner === "function") {
            this.fileUpload.beforeSigner(xhr, url);
        }
        xhr.send();
    }); }
}
AuthorizationMethod.prototype.request = {};
AuthorizationMethod.makeSignParamsObject = params => {
    $_$twiz("params", params, 2868, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/AuthorizationMethod.ts", "{\"arrow\":true,\"parens\":[2862,2868]}");
    const out = {};
    for (const param in params) {
        if (!params.hasOwnProperty(param)) {
            continue;
        }
        if (typeof params[param] === "function") {
            out[param] = params[param]();
        }
        else {
            out[param] = params[param];
        }
    }
    return out;
};
export { AuthorizationMethod };
