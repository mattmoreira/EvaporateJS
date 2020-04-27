declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;
declare namespace $_$twiz {
    function track<T>(value: T, filename: string, offset: number): T;
    function track(value: any, filename: string, offset: number): any;
}
import { SignedS3AWSRequest } from "./SignedS3AWSRequest";
import { ABORTED, CANCELED } from "./Constants";
class CancelableS3AWSRequest extends SignedS3AWSRequest {
    constructor(fileUpload, request) {
        super(fileUpload, request);
    }
    errorExceptionStatus() { return [ABORTED, CANCELED].includes(this.fileUpload.status); }
}
export { CancelableS3AWSRequest };
