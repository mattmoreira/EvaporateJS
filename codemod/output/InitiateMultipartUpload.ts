declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;
declare namespace $_$twiz {
    function track<T>(value: T, filename: string, offset: number): T;
    function track(value: any, filename: string, offset: number): any;
}
import { CancelableS3AWSRequest } from "./CancelableS3AWSRequest";
import { Global } from "./Global";
class InitiateMultipartUpload extends CancelableS3AWSRequest {
    public awsKey: any;
    constructor(fileUpload, awsKey) {
        const request = {
            method: "POST",
            path: "?uploads",
            step: "initiate",
            x_amz_headers: fileUpload.xAmzHeadersAtInitiate,
            not_signed_headers: fileUpload.notSignedHeadersAtInitiate,
            response_match: "<UploadId>(.+)</UploadId>"
        };
        super(fileUpload, request);
        this.awsKey = awsKey;
    }
    success() {
        const match = this.currentXhr.response.match(new RegExp(this.request.response_match));
        this.fileUpload.uploadId = match[1];
        this.fileUpload.awsKey = this.awsKey;
        Global.l.d("InitiateMultipartUpload ID is", this.fileUpload.uploadId);
        this.fileUpload.createUploadFile();
        this.awsDeferred.resolve(this.currentXhr);
    }
}
export { InitiateMultipartUpload };
