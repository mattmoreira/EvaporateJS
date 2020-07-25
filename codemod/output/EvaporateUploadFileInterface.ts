import { FileUploadCallbacksInterface } from './FileUploadInterface'
import { Dictionary } from './Types'

interface UploadHeadersInterface {
  xAmzHeadersAtInitiate: Dictionary<string>
  notSignedHeadersAtInitiate: Dictionary<string>
  xAmzHeadersAtUpload: Dictionary<string>
  xAmzHeadersAtComplete: Dictionary<string>
  xAmzHeadersCommon: Dictionary<string>
  contentType: string
}

interface UploadFileDataInterface {
  name: string
  file: File
}

export type UploadFileConfig = FileUploadCallbacksInterface &
  UploadHeadersInterface &
  UploadFileDataInterface
