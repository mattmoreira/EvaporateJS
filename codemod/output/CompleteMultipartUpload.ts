declare function $_$twiz(name: string, value: any, pos: number
//http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadComplete.html
, //http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadComplete.html
filename: string, opts: any): void;
declare namespace $_$twiz {
    function track<T>(value: T, filename: string, offset: number): T;
    function track(value: any, filename: string, offset: number): any;
}
import { CancelableS3AWSRequest } from "./CancelableS3AWSRequest";
//http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadComplete.html
class CompleteMultipartUpload extends CancelableS3AWSRequest {
    constructor(fileUpload) {
        fileUpload.info("will attempt to complete upload");
        const request = {
            method: "POST",
            contentType: "application/xml; charset=UTF-8",
            path: `?uploadId=${fileUpload.uploadId}`,
            x_amz_headers: fileUpload.xAmzHeadersCommon || fileUpload.xAmzHeadersAtComplete,
            step: "complete"
        };
        super(fileUpload, request);
    }
    getPayload() { return Promise.resolve(this.fileUpload.getCompletedPayload()); }
}
export { CompleteMultipartUpload };
