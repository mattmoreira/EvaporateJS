export type Request = {
  method: string
  path: string
  query_string?: string
  x_amz_headers: object
  step: string
  success404?: boolean
  contentType?: string
  not_signed_headers?: object
  contentSha256?: string
  onProgress?: Function
}

export type Defer = {
  resolve: (value: any) => void
  reject: (value: any) => void
  promise: Promise<any>
}
