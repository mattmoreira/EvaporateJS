import { CreateConfig } from './EvaporateCreateConfigInterface'
import { Request } from './Types'
import { SignedS3AWSRequest } from './SignedS3AWSRequest'

class AwsSignature {
  request: Request
  awsRequest: SignedS3AWSRequest
  con: CreateConfig
  payload: ArrayBuffer

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

  datetime(timeOffset: number): Date {
    return new Date(new Date().getTime() + timeOffset)
  }

  dateString(timeOffset: number): string {
    return `${this.datetime(timeOffset)
      .toISOString()
      .slice(0, 19)
      .replace(/-|:/g, '')}Z`
  }
}

export { AwsSignature }
