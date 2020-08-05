import { IMMUTABLE_OPTIONS } from '../Constants'
import {
  EVAPORATE_STATUS,
  ACTIVE_STATUSES,
  PAUSED_STATUSES
} from '../Evaporate/EvaporateStatusEnum'

import {
  extend,
  removeAtIndex,
  readableFileSize,
  s3EncodedObjectName
} from '../Utils'

import { Global } from '../Global'
import { FileUpload } from './FileUpload'
import { Dictionary } from '../Types'

import {
  EvaporateConfigInterface,
  EvaporateOverrideConfigInterface
} from '../Evaporate/EvaporateConfigInterface'

import { UploadFileConfig } from '../Evaporate/EvaporateUploadFileInterface'
import Evaporate from '../Evaporate/Evaporate'

export class FileUploadCentral {
  public pendingFiles: Dictionary<FileUpload> = {}
  public queuedFiles: Array<FileUpload> = []
  public filesInProcess: Array<FileUpload> = []
  public evaporatingCount: number = 0

  constructor(public evaporate: Evaporate) {}

  startNextFile(reason: string) {
    if (
      !this.queuedFiles.length ||
      this.evaporatingCount >= this.evaporate.config.maxConcurrentParts
    ) {
      return
    }

    const fileUpload: FileUpload = this.queuedFiles.shift()

    if (fileUpload.status === EVAPORATE_STATUS.PENDING) {
      Global.l.d(
        'Starting',
        decodeURIComponent(fileUpload.name),
        'reason:',
        reason
      )
      this.evaporatingCnt(+1)
      fileUpload.start()
    } else {
      // Add the file back to the stack, it's not ready
      Global.l.d(
        'Requeued',
        decodeURIComponent(fileUpload.name),
        'status:',
        fileUpload.status,
        'reason:',
        reason
      )

      this.queuedFiles.push(fileUpload)
    }
  }

  fileCleanup(fileUpload: FileUpload) {
    removeAtIndex(this.queuedFiles, fileUpload)

    if (removeAtIndex(this.filesInProcess, fileUpload)) {
      this.evaporatingCnt(-1)
    }

    fileUpload.done()
    this.consumeRemainingSlots()
  }

  queueFile(fileUpload: FileUpload) {
    this.filesInProcess.push(fileUpload)
    this.queuedFiles.push(fileUpload)

    if (this.filesInProcess.length === 1) {
      this.startNextFile('first file')
    }
  }

  add(
    uploadFileConfig: UploadFileConfig,
    overrideEvaporateConfig?: EvaporateOverrideConfigInterface
  ): Promise<string> {
    const self = this
    let evaporateConfig

    return new Promise(
      (resolve: (value: string) => void, reject: (error: string) => void) => {
        const c = extend(overrideEvaporateConfig, {})

        IMMUTABLE_OPTIONS.forEach((a: string) => {
          delete c[a]
        })

        evaporateConfig = extend(self.evaporate.config, c)

        if (
          typeof uploadFileConfig === 'undefined' ||
          typeof uploadFileConfig.file === 'undefined'
        ) {
          return reject('Missing file')
        }

        if (
          evaporateConfig.maxFileSize &&
          uploadFileConfig.file.size > evaporateConfig.maxFileSize
        ) {
          return reject(
            `File size too large. Maximum size allowed is ${readableFileSize(
              evaporateConfig.maxFileSize
            )}`
          )
        }

        if (typeof uploadFileConfig.name === 'undefined') {
          return reject('Missing attribute: name')
        }

        if (evaporateConfig.encodeFilename) {
          // correctly encode to an S3 object name, considering '/' and ' '
          uploadFileConfig.name = s3EncodedObjectName(uploadFileConfig.name)
        }

        const fileConfig = extend({}, uploadFileConfig, {
          status: EVAPORATE_STATUS.PENDING,
          priority: 0,
          loadedBytes: 0,
          sizeBytes: uploadFileConfig.file.size,
          eTag: ''
        }) as UploadFileConfig

        const fileUpload = new FileUpload(fileConfig, evaporateConfig, self)

        const fileKey = fileUpload.id
        self.pendingFiles[fileKey] = fileUpload
        self.queueFile(fileUpload)

        // Resolve or reject the Add promise based on how the fileUpload completes
        fileUpload.deferredCompletion.promise.then(
          () => {
            self.fileCleanup(fileUpload)
            resolve(decodeURIComponent(fileUpload.name))
          },
          (reason: string) => {
            self.fileCleanup(fileUpload)
            reject(reason)
          }
        )
      }
    )
  }

  _cancelAll() {
    Global.l.d('Canceling all file uploads')
    const promises = []

    for (const key in this.pendingFiles) {
      if (this.pendingFiles.hasOwnProperty(key)) {
        const file = this.pendingFiles[key]

        if (ACTIVE_STATUSES.includes(file.status)) {
          promises.push(file.stop())
        }
      }
    }

    if (!promises.length) {
      promises.push(Promise.reject('No files to cancel.'))
    }

    return Promise.all(promises)
  }

  _cancelOne(id: string) {
    const promise = []

    if (this.pendingFiles[id]) {
      promise.push(this.pendingFiles[id].stop())
    } else {
      promise.push(Promise.reject('File does not exist'))
    }

    return Promise.all(promise)
  }

  _pauseAll(force: boolean): Promise<any> {
    Global.l.d('Pausing all file uploads')
    const promises = []

    for (const key in this.pendingFiles) {
      if (this.pendingFiles.hasOwnProperty(key)) {
        const file = this.pendingFiles[key]

        if (ACTIVE_STATUSES.includes(file.status)) {
          this._pause(file, force, promises)
        }
      }
    }

    return Promise.all(promises)
  }

  _pauseOne(id: string, force: boolean) {
    const promises = []
    const file = this.pendingFiles[id]

    if (typeof file === 'undefined') {
      promises.push(
        Promise.reject('Cannot pause a file that has not been added.')
      )
    } else if (file.status === EVAPORATE_STATUS.PAUSED) {
      promises.push(
        Promise.reject('Cannot pause a file that is already paused.')
      )
    }

    if (!promises.length) {
      this._pause(file, force, promises)
    }

    return Promise.all(promises)
  }

  _pause(fileUpload: FileUpload, force: boolean, promises): void {
    promises.push(fileUpload.pause(force))
    removeAtIndex(this.filesInProcess, fileUpload)
    removeAtIndex(this.queuedFiles, fileUpload)
  }

  _resumeAll() {
    Global.l.d('Resuming all file uploads')

    for (const key in this.pendingFiles) {
      if (this.pendingFiles.hasOwnProperty(key)) {
        const file = this.pendingFiles[key]

        if (PAUSED_STATUSES.includes(file.status)) {
          this.resumeFile(file)
        }
      }
    }

    return Promise.resolve()
  }

  _resumeOne(id: string): Promise<string[]> {
    const file = this.pendingFiles[id]
    const promises = []

    if (typeof file === 'undefined') {
      promises.push(Promise.reject('Cannot pause a file that does not exist.'))
    } else if (!PAUSED_STATUSES.includes(file.status)) {
      promises.push(
        Promise.reject('Cannot resume a file that has not been paused.')
      )
    } else {
      this.resumeFile(file)
    }

    return Promise.all(promises)
  }

  resumeFile(fileUpload: FileUpload): void {
    fileUpload.resume()
    this.queueFile(fileUpload)
  }

  consumeRemainingSlots(): void {
    let avail = this.evaporate.config.maxConcurrentParts - this.evaporatingCount

    if (!avail) {
      return
    }

    for (let i = 0; i < this.filesInProcess.length; i++) {
      const file = this.filesInProcess[i]
      const consumed = file.consumeSlots()

      if (consumed < 0) {
        continue
      }

      avail -= consumed

      if (!avail) {
        return
      }
    }
  }

  evaporatingCnt(incr: number): void {
    this.evaporatingCount = Math.max(0, this.evaporatingCount + incr)
    this.evaporate.config.evaporateChanged(this, this.evaporatingCount)
  }
}
