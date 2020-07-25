export interface FileUploadStats {
  speed: number
  readableSpeed: string
  loaded: number
  totalUploaded: number
  remainingSize: number
  secondsLeft: number
  fileSize: number
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
  signParams: { [key: string]: any }
  uploadId: string
}

interface FileUploadLogCallbacksInterface {
  info: (...msg: string[]) => void
  warn: (...msg: string[]) => void
  error: (msg: string) => void
}

interface FileUploadLifecycleEventCallbacksInterface {
  started: (file_key: string) => void
  paused: (file_key?: string) => void
  resumed: (file_key?: string) => void
  pausing: (file_key?: string) => void
  progress: (p: number, stats: FileUploadStats) => void
  cancelled: () => void
  complete: (
    xhr: XMLHttpRequest,
    awsObjectKey: string,
    stats: FileUploadStats
  ) => void
}

interface FileUploadEventCallbacksInterface {
  beforeSigner?: (xhr: XMLHttpRequest, url: string) => void
  uploadInitiated: (s3UploadId?: string) => void
  nameChanged: (awsObjectKey: string) => void
}

export type FileUploadCallbacksInterface = FileUploadLogCallbacksInterface &
  FileUploadLifecycleEventCallbacksInterface &
  FileUploadEventCallbacksInterface
