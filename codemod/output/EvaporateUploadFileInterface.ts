interface TransferStats {
  speed: number
  readableSpeed: string
  loaded: number
  totalUploaded: number
  remainingSize: number
  secondsLeft: number
  fileSize: number
}

export interface UploadFileConfig {
  name: string
  file: File
  xAmzHeadersAtInitiate?: { [key: string]: string }
  notSignedHeadersAtInitiate?: { [key: string]: string }
  xAmzHeadersAtUpload?: { [key: string]: string }
  xAmzHeadersAtComplete?: { [key: string]: string }
  xAmzHeadersCommon?: { [key: string]: string }
  started?: (file_key: string) => void
  uploadInitiated?: (s3UploadId?: string) => void
  paused?: (file_key: string) => void
  resumed?: (file_key: string) => void
  pausing?: (file_key: string) => void
  cancelled?: () => void
  complete?: (
    xhr: XMLHttpRequest,
    awsObjectKey: string,
    stats: TransferStats
  ) => void
  nameChanged?: (awsObjectKey: string) => void
  info?: (msg: string) => void
  warn?: (msg: string) => void
  error?: (msg: string) => void
  progress?: (p: number, stats: TransferStats) => void
  contentType?: string
  beforeSigner?: (xhr: XMLHttpRequest, url: string) => void
}
