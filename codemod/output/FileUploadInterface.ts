import { PutPart } from './PutPart'
import { EVAPORATE_STATUS } from './Constants'

export interface FileUploadStats {
  speed: number
  readableSpeed: string
  loaded: number
  totalUploaded: number
  remainingSize: number
  secondsLeft: number
  fileSize: number
}

export interface FileS3Part {
  awsRequest?: PutPart
  isEmpty: boolean
  loadedBytes: number
  loadedBytesPrevious?: number
  md5_digest?: string
  partNumber: number
  status: EVAPORATE_STATUS
  eTag?: string
  size?: number
  LastModified?: string
}

export interface FileUploadInterface {
  eTag?: string
  completedAt?: string
  awsKey: string
  bucket: string
  createdAt: string
  fileSize: number
  fileType: string
  firstMd5Digest?: string
  lastModifiedDate: string
  partSize: number
  signParams: {}
  uploadId: string
}
