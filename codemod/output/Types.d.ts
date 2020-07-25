export type Request = {
  method: string
  path: string
  query_string?: string
  x_amz_headers: object
  step: string
  success404?: boolean
  contentType?: string
  not_signed_headers?: Dictionary<any>
  contentSha256?: string
  onProgress?: (this: XMLHttpRequest, ev: ProgressEvent<EventTarget>) => any
  dateString?: string
  md5_digest?: string
  response_match?: string
  auth?: string
}

export type Defer<T> = {
  resolve: (value: any) => void
  reject: (value: any) => void
  promise: Promise<T>
}

interface Dictionary<T> {
  [Key: string]: T
}
