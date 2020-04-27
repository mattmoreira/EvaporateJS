declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;
declare namespace $_$twiz {
    function track<T>(value: T, filename: string, offset: number): T;
    function track(value: any, filename: string, offset: number): any;
}
import { Global } from "./Global";
import { ERROR, ABORTED } from "./Constants";
import { defer, awsUrl, uri, extend, signingVersion, getAwsResponse, authorizationMethod } from "./Utils";
class SignedS3AWSRequest {
    public fileUpload: any;
    public con: any;
    public attempts: any;
    public localTimeOffset: any;
    public awsDeferred: any;
    public started: any;
    public awsUrl: any;
    public awsHost: any;
    public request: any;
    public signer: any;
    public currentXhr: any;
    public payloadPromise: any;
    constructor(fileUpload, request?) {
        this.fileUpload = fileUpload;
        this.con = fileUpload.con;
        this.attempts = 1;
        this.localTimeOffset = this.fileUpload.localTimeOffset;
        this.awsDeferred = defer();
        this.started = defer();
        this.awsUrl = awsUrl(this.con);
        this.awsHost = uri(this.awsUrl).hostname;
        const r = extend({}, request);
        if (fileUpload.contentType) {
            r.contentType = fileUpload.contentType;
        }
        this.updateRequest(r);
    }
    getPath() {
        let path = `/${this.con.bucket}/${this.fileUpload.name}`;
        if (this.con.cloudfront || this.awsUrl.includes("cloudfront")) {
            path = `/${this.fileUpload.name}`;
        }
        return path;
    }
    updateRequest(request) {
        $_$twiz("request", request, 1237, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{}");
        this.request = request;
        this.signer = signingVersion(this);
    }
    success() { this.awsDeferred.resolve(this.currentXhr); }
    backOffWait() { return this.attempts === 1
        ? 0
        : 1000 *
            Math.min(this.con.maxRetryBackoffSecs, this.con.retryBackoffPower ** (this.attempts - 2)); }
    error(reason) {
        $_$twiz("reason", reason, 1610, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{}");
        if (this.errorExceptionStatus()) {
            return;
        }
        this.signer.error();
        Global.l.d(this.request.step, "error:", this.fileUpload.id, reason);
        if (typeof this.errorHandler(reason) !== "undefined") {
            return;
        }
        this.fileUpload.warn("Error in ", this.request.step, reason);
        this.fileUpload.setStatus(ERROR);
        const self = this;
        const backOffWait = this.backOffWait();
        this.attempts += 1;
        setTimeout(() => { if (!self.errorExceptionStatus()) {
            self.trySend();
        } }, backOffWait);
    }
    errorHandler(reason) { $_$twiz("reason", reason, 2194, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{}"); }
    errorExceptionStatus() { return false; }
    getPayload() { return Promise.resolve(null); }
    success_status(xhr) { $_$twiz("xhr", xhr, 2326, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{}"); return ((xhr.status >= 200 && xhr.status <= 299) ||
        (this.request.success404 && xhr.status === 404)); }
    stringToSign() { return encodeURIComponent(this.signer.stringToSign()); }
    canonicalRequest() { return this.signer.canonicalRequest(); }
    signResponse(payload, stringToSign, signatureDateTime) {
        $_$twiz("payload", payload, 2635, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{}");
        $_$twiz("stringToSign", stringToSign, 2649, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{}");
        $_$twiz("signatureDateTime", signatureDateTime, 2668, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{}");
        const self = this;
        return new Promise(resolve => {
            $_$twiz("resolve", resolve, 2726, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{\"arrow\":true,\"parens\":[2719,2726]}");
            if (typeof self.con.signResponseHandler === "function") {
                return self.con
                    .signResponseHandler(payload, stringToSign, signatureDateTime)
                    .then(resolve);
            }
            resolve(payload);
        });
    }
    sendRequestToAWS() {
        const self = this;
        return new Promise((resolve, reject) => {
            $_$twiz("resolve", resolve, 3043, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{\"arrow\":true}");
            $_$twiz("reject", reject, 3051, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{\"arrow\":true}");
            const xhr = new XMLHttpRequest();
            self.currentXhr = xhr;
            let url = [self.awsUrl, self.getPath(), self.request.path].join("");
            const all_headers = {};
            if (self.request.query_string) {
                url += self.request.query_string;
            }
            extend(all_headers, self.request.not_signed_headers);
            extend(all_headers, self.request.x_amz_headers);
            xhr.onreadystatechange = () => { if (xhr.readyState === 4) {
                if (self.success_status(xhr)) {
                    if (self.request.response_match &&
                        xhr.response.match(new RegExp(self.request.response_match)) ===
                            undefined) {
                        reject(`AWS response does not match set pattern: ${self.request.response_match}`);
                    }
                    else {
                        resolve();
                    }
                }
                else {
                    let reason = xhr.responseText ? getAwsResponse(xhr) : " ";
                    reason += `status:${xhr.status}`;
                    reject(reason);
                }
            } };
            xhr.open(self.request.method, url);
            xhr.setRequestHeader("Authorization", self.signer.authorizationString());
            for (const key in all_headers) {
                if (all_headers.hasOwnProperty(key)) {
                    xhr.setRequestHeader(key, all_headers[key]);
                }
            }
            self.signer.setHeaders(xhr);
            if (self.request.contentType) {
                xhr.setRequestHeader("Content-Type", self.request.contentType);
            }
            if (self.request.md5_digest) {
                xhr.setRequestHeader("Content-MD5", self.request.md5_digest);
            }
            xhr.onerror = ev => {
                $_$twiz("ev", ev, 4699, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{\"arrow\":true,\"parens\":[4697,4699]}");
                const reason = xhr.responseText
                    ? getAwsResponse(xhr)
                    : "transport error";
                reject(reason);
            };
            if (typeof self.request.onProgress === "function") {
                xhr.upload.onprogress = self.request.onProgress;
            }
            self.getPayload().then(xhr.send.bind(xhr), reject);
            setTimeout(() => { 
            // We have to delay here or Safari will hang
            self.started.resolve(`request sent ${self.request.step}`); }, 20);
            self.signer.payload = null;
            self.payloadPromise = undefined;
        });
    }
    //see: http://docs.amazonwebservices.com/AmazonS3/latest/dev/RESTAuthentication.html#ConstructingTheAuthenticationHeader
    authorize() {
        this.request.dateString = this.signer.dateString(this.localTimeOffset);
        this.request.x_amz_headers = extend(this.request.x_amz_headers, {
            "x-amz-date": this.request.dateString
        });
        return this.signer
            .getPayload()
            .then(() => (authorizationMethod(this).authorize()));
    }
    authorizationSuccess(authorization) {
        $_$twiz("authorization", authorization, 5753, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{}");
        Global.l.d(this.request.step, "signature:", authorization);
        this.request.auth = authorization;
    }
    trySend() {
        const self = this;
        return this.authorize().then(value => {
            $_$twiz("value", value, 5941, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/SignedS3AWSRequest.ts", "{\"arrow\":true,\"parens\":[5936,5941]}");
            self.authorizationSuccess(value);
            if (self.fileUpload.status === ABORTED) {
                return;
            }
            self
                .sendRequestToAWS()
                .then(self.success.bind(self), self.error.bind(self));
        }, self.error.bind(self));
    }
    send() {
        this.trySend();
        return this.awsDeferred.promise;
    }
}
SignedS3AWSRequest.prototype.fileUpload = undefined;
SignedS3AWSRequest.prototype.con = undefined;
SignedS3AWSRequest.prototype.awsUrl = undefined;
SignedS3AWSRequest.prototype.awsHost = undefined;
SignedS3AWSRequest.prototype.localTimeOffset = 0;
SignedS3AWSRequest.prototype.awsDeferred = undefined;
SignedS3AWSRequest.prototype.started = undefined;
export { SignedS3AWSRequest };
