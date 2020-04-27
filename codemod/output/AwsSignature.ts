declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;
declare namespace $_$twiz {
    function track<T>(value: T, filename: string, offset: number): T;
    function track(value: any, filename: string, offset: number): any;
}
class AwsSignature {
  request: any = {}
  awsRequest: any
  con: any

  constructor(awsRequest) {
    this.awsRequest = awsRequest
    this.request = awsRequest.request
    this.con = awsRequest.fileUpload.con
  }

  error() {}
  authorizationString() {}
  stringToSign() {}
  canonicalRequest() {}
  setHeaders(xhr: XMLHttpRequest) {}

  datetime(timeOffset) {
    return new Date(new Date().getTime() + timeOffset)
  }

  dateString(timeOffset) {
    return `${this.datetime(timeOffset)
      .toISOString()
      .slice(0, 19)
      .replace(/-|:/g, '')}Z`
  }
}

export { AwsSignature }
