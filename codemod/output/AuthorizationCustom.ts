declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;
declare namespace $_$twiz {
    function track<T>(value: T, filename: string, offset: number): T;
    function track(value: any, filename: string, offset: number): any;
}
import { AuthorizationMethod } from "./AuthorizationMethod";
class AuthorizationCustom extends AuthorizationMethod {
    constructor(awsRequest) {
        super(awsRequest);
    }
    authorize() { return this.con
        .customAuthMethod(AuthorizationMethod.makeSignParamsObject(this.fileUpload.signParams), AuthorizationMethod.makeSignParamsObject(this.con.signHeaders), this.awsRequest.stringToSign(), this.request.dateString, this.awsRequest.canonicalRequest())
        .catch(reason => {
        $_$twiz("reason", reason, 528, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/AuthorizationCustom.ts", "{\"arrow\":true,\"parens\":[522,528]}");
        this.fileUpload.deferredCompletion.reject(reason);
        throw reason;
    }); }
}
export { AuthorizationCustom };
