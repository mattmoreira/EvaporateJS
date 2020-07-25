import { FileUploadCallbacksInterface } from './FileUploadInterface'

interface UploadHeadersInterface {
  xAmzHeadersAtInitiate: { [key: string]: string }
  notSignedHeadersAtInitiate: { [key: string]: string }
  xAmzHeadersAtUpload: { [key: string]: string }
  xAmzHeadersAtComplete: { [key: string]: string }
  xAmzHeadersCommon: { [key: string]: string }
  contentType: string
}

interface UploadFileDataInterface {
  name: string
  file: File
}

export type UploadFileConfig = FileUploadCallbacksInterface &
  Partial<UploadHeadersInterface> &
  UploadFileDataInterface
