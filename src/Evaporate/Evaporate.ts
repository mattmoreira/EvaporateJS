import { HistoryCache } from '../Utils/HistoryCache'
import { Global } from '../Global'

import { extend, noOpLogger, getSupportedBlobSlice } from '../Utils'

import {
  EvaporateConfigInterface,
  EvaporateOverrideConfigInterface
} from './EvaporateConfigInterface'

import { EvaporateValidationEnum } from './EvaporateValidationEnum'
import { FileUploadCentral } from '../FileUpload/FileUploadCentral'
import { UploadFileConfig } from './EvaporateUploadFileInterface'

class Evaporate {
  public config: EvaporateConfigInterface = null
  public _instantiationError: EvaporateValidationEnum
  public supported: boolean = false
  private fileUploadCentral: FileUploadCentral = null
  public localTimeOffset: number = 0

  static getLocalTimeOffset(config: EvaporateConfigInterface): Promise<number> {
    return new Promise(
      (resolve: (value: number) => void, reject: (value: string) => void) => {
        if (typeof config.localTimeOffset === 'number') {
          return resolve(config.localTimeOffset)
        }

        if (config.timeUrl) {
          const xhr = new XMLHttpRequest()
          xhr.open(
            'GET',
            `${config.timeUrl}?requestTime=${new Date().getTime()}`
          )

          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
              const server_date = new Date(
                Date.parse(xhr.responseText)
              ).getTime()
              const offset = server_date - new Date().getTime()
              Global.l.d('localTimeOffset is', offset, 'ms')
              resolve(offset)
            }
          }

          xhr.onerror = ev => {
            Global.l.e('xhr error timeUrl', xhr)
            reject(`Fetching offset time failed with status: ${xhr.status}`)
          }

          xhr.send()
        } else {
          resolve(0)
        }
      }
    )
  }

  static create(config: EvaporateConfigInterface): Promise<Evaporate> {
    const evapConfig = extend({}, config) as EvaporateConfigInterface

    return Evaporate.getLocalTimeOffset(evapConfig).then((offset: number) => {
      evapConfig.localTimeOffset = offset

      return new Promise(
        (
          resolve: (evaporate: Evaporate) => void,
          reject: (validationStatus: EvaporateValidationEnum) => void
        ) => {
          const e = new Evaporate(evapConfig)

          if (e.supported === true) {
            resolve(e)
          } else {
            reject(e._instantiationError)
          }
        }
      )
    })
  }

  constructor(config: EvaporateConfigInterface) {
    this.config = extend(
      {
        readableStreams: false,
        readableStreamPartMethod: null,
        bucket: null,
        logging: true,
        maxConcurrentParts: 5,
        partSize: 6 * 1024 * 1024,
        retryBackoffPower: 2,
        maxRetryBackoffSecs: 300,
        progressIntervalMS: 1000,
        cloudfront: false,
        s3Acceleration: false,
        mockLocalStorage: false,
        encodeFilename: true,
        computeContentMd5: false,
        allowS3ExistenceOptimization: false,
        onlyRetryForSameFileName: false,
        timeUrl: null,
        cryptoMd5Method: null,
        cryptoHexEncodedHash256: null,
        aws_key: null,
        awsRegion: 'us-east-1',
        awsSignatureVersion: '4',
        sendCanonicalRequestToSignerUrl: false,

        // Must be a whole number of hours. Will be interpreted as negative (hours in the past).
        s3FileCacheHoursAgo: null,

        signParams: {},
        signHeaders: {},
        customAuthMethod: undefined,
        maxFileSize: null,
        signResponseHandler: null,
        xhrWithCredentials: false,

        // undocumented, experimental
        localTimeOffset: undefined,

        evaporateChanged() {},
        abortCompletionThrottlingMs: 1000
      },
      config
    ) as EvaporateConfigInterface

    if (typeof window !== 'undefined' && window.console) {
      Global.l = {
        ...window.console,
        d: Global.l.log,
        w: window.console.warn ? Global.l.warn : Global.l.d,
        e: window.console.error ? Global.l.error : Global.l.d
      }
    }

    this._instantiationError = this.validateEvaporateOptions()

    if (this._instantiationError !== EvaporateValidationEnum.OK) {
      this.supported = false
      return
    } else {
      delete this._instantiationError
    }

    if (!this.config.logging) {
      // Reset the logger to be a no_op
      Global.l = noOpLogger()
    }

    const _d = new Date()
    Global.HOURS_AGO = new Date(
      _d.setHours(_d.getHours() - (this.config.s3FileCacheHoursAgo || -100))
    )

    if (typeof config.localTimeOffset === 'number') {
      this.localTimeOffset = config.localTimeOffset
    } else {
      const self = this

      Evaporate.getLocalTimeOffset(this.config).then(offset => {
        self.localTimeOffset = offset
      })
    }

    this.fileUploadCentral = new FileUploadCentral(this)

    Global.historyCache = new HistoryCache(this.config.mockLocalStorage)
  }

  forceRetry() {}

  add(
    uploadFileConfig: UploadFileConfig,
    overrideEvaporateConfig?: EvaporateOverrideConfigInterface
  ): Promise<string> {
    return this.fileUploadCentral.add(uploadFileConfig, overrideEvaporateConfig)
  }

  pause(id: string, options: { force?: boolean } = {}): Promise<any> {
    const force: boolean =
      typeof options.force === 'undefined' ? false : options.force

    return typeof id === 'undefined'
      ? this.fileUploadCentral._pauseAll(force)
      : this.fileUploadCentral._pauseOne(id, force)
  }

  cancel(id: string) {
    return typeof id === 'undefined'
      ? this.fileUploadCentral._cancelAll()
      : this.fileUploadCentral._cancelOne(id)
  }

  resume(id: string): Promise<string[] | void> {
    return typeof id === 'undefined'
      ? this.fileUploadCentral._resumeAll()
      : this.fileUploadCentral._resumeOne(id)
  }

  validateEvaporateOptions(): EvaporateValidationEnum {
    this.supported = !(
      typeof File === 'undefined' || typeof Promise === 'undefined'
    )

    if (!this.supported) {
      return EvaporateValidationEnum.MISSING_SUPPORT_FILE_PROMISE
    }

    if (this.config.readableStreams) {
      if (typeof this.config.readableStreamPartMethod !== 'function') {
        return EvaporateValidationEnum.MISSING_READABLE_STREAM_PART_METHOD
      }
    } else {
      if (!getSupportedBlobSlice()) {
        return EvaporateValidationEnum.MISSING_SUPPORT_BLOB
      }
    }

    if (
      !this.config.signerUrl &&
      typeof this.config.customAuthMethod !== 'function'
    ) {
      return EvaporateValidationEnum.MISSING_SIGNER_URL
    }

    if (!this.config.bucket) {
      return EvaporateValidationEnum.MISSING_BUCKET
    }

    if (this.config.computeContentMd5) {
      this.supported =
        typeof FileReader.prototype.readAsArrayBuffer !== 'undefined'

      if (!this.supported) {
        return EvaporateValidationEnum.MISSING_SUPPORT_READ_AS_ARRAY_BUFFER
      }

      if (typeof this.config.cryptoMd5Method !== 'function') {
        return EvaporateValidationEnum.MISSING_COMPUTE_CONTENT_MD5
      }

      if (this.config.awsSignatureVersion === '4') {
        if (typeof this.config.cryptoHexEncodedHash256 !== 'function') {
          return EvaporateValidationEnum.MISSING_V4_CRYPTO_HEX_ENCODED_HASH256
        }
      }
    } else if (this.config.awsSignatureVersion === '4') {
      return EvaporateValidationEnum.MISSING_V4_COMPUTE_CONTENT_MD5
    }

    return EvaporateValidationEnum.OK
  }
}

export default Evaporate
