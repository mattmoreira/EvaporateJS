(() => {
  const FAR_FUTURE = new Date('2060-10-22');
  let HOURS_AGO;
  const PENDING = 0;
  const EVAPORATING = 2;
  const COMPLETE = 3;
  const PAUSED = 4;
  const CANCELED = 5;
  const ERROR = 10;
  const ABORTED = 20;
  const PAUSING = 30;
  const PAUSED_STATUSES = [PAUSED, PAUSING];
  const ACTIVE_STATUSES = [PENDING, EVAPORATING, ERROR];
  const ETAG_OF_0_LENGTH_BLOB = '"d41d8cd98f00b204e9800998ecf8427e"';
  const PARTS_MONITOR_INTERVAL_MS = 2 * 60 * 1000;

  const IMMUTABLE_OPTIONS = [
    'maxConcurrentParts',
    'logging',
    'cloudfront',
    'encodeFilename',
    'computeContentMd5',
    'allowS3ExistenceOptimization',
    'onlyRetryForSameFileName',
    'timeUrl',
    'cryptoMd5Method',
    'cryptoHexEncodedHash256',
    'awsRegion',
    'awsSignatureVersion',
    'evaporateChanged'
  ];

  const S3_EXTRA_ENCODED_CHARS =  {
    33: "%21", // !
    39: "%27", // '
    40: "%28", // (
    41: "%29", // )
    42: "%2A"  // *
  };

  let l;

  class Evaporate {
    constructor(config) {
      this.config = extend({
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
        s3FileCacheHoursAgo: null, // Must be a whole number of hours. Will be interpreted as negative (hours in the past).
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
      }, config);

      if (typeof window !== 'undefined' && window.console) {
        l = window.console;
        l.d = l.log;
        l.w = window.console.warn ? l.warn : l.d;
        l.e = window.console.error ? l.error : l.d;
      }

      this._instantiationError = this.validateEvaporateOptions();
      if (typeof this._instantiationError === 'string') {
        this.supported = false;
        return;
      } else {
        delete this._instantiationError;
      }

      if (!this.config.logging) {
        // Reset the logger to be a no_op
        l = noOpLogger();
      }

      const _d = new Date();
      HOURS_AGO = new Date(_d.setHours(_d.getHours() - (this.config.s3FileCacheHoursAgo || -100)));
      if (typeof config.localTimeOffset === 'number') {
        this.localTimeOffset = config.localTimeOffset;
      } else {
        const self = this;
        Evaporate.getLocalTimeOffset(this.config)
            .then(offset => {
              self.localTimeOffset = offset;
            });
      }
      this.pendingFiles = {};
      this.queuedFiles = [];
      this.filesInProcess = [];
      historyCache = new HistoryCache(this.config.mockLocalStorage);
    }

    startNextFile(reason) {
      if (!this.queuedFiles.length ||
          this.evaporatingCount >= this.config.maxConcurrentParts) { return; }
      const fileUpload = this.queuedFiles.shift();
      if (fileUpload.status === PENDING) {
        l.d('Starting', decodeURIComponent(fileUpload.name), 'reason:', reason);
        this.evaporatingCnt(+1);
        fileUpload.start();
      } else {
        // Add the file back to the stack, it's not ready
        l.d('Requeued', decodeURIComponent(fileUpload.name), 'status:', fileUpload.status, 'reason:', reason);
        this.queuedFiles.push(fileUpload);
      }
    }

    fileCleanup(fileUpload) {
      removeAtIndex(this.queuedFiles, fileUpload);
      if (removeAtIndex(this.filesInProcess, fileUpload)) {
        this.evaporatingCnt(-1);
      }
      fileUpload.done();
      this.consumeRemainingSlots();
    }

    queueFile(fileUpload) {
      this.filesInProcess.push(fileUpload);
      this.queuedFiles.push(fileUpload);
      if (this.filesInProcess.length === 1) {
        this.startNextFile('first file');
      }
    }

    add(file, pConfig) {
      const self = this;
      let fileConfig;
      return new Promise((resolve, reject) => {
        const c = extend(pConfig, {});

        IMMUTABLE_OPTIONS.forEach(a => { delete c[a]; });

        fileConfig = extend(self.config, c);

        if (typeof file === 'undefined' || typeof file.file === 'undefined') {
          return reject('Missing file');
        }
        if (fileConfig.maxFileSize && file.file.size > fileConfig.maxFileSize) {
          return reject(`File size too large. Maximum size allowed is ${readableFileSize(fileConfig.maxFileSize)}`);
        }
        if (typeof file.name === 'undefined') {
          return reject('Missing attribute: name');
        }

        if (fileConfig.encodeFilename) {
          // correctly encode to an S3 object name, considering '/' and ' '
          file.name = s3EncodedObjectName(file.name);
        }

        const fileUpload = new FileUpload(extend({
              started() {},
              uploadInitiated() {},
              progress() {},
              complete() {},
              cancelled() {},
              paused() {},
              resumed() {},
              pausing() {},
              nameChanged() {},
              info() {},
              warn() {},
              error() {},
              beforeSigner: undefined,
              xAmzHeadersAtInitiate: {},
              notSignedHeadersAtInitiate: {},
              xAmzHeadersCommon: null,
              xAmzHeadersAtUpload: {},
              xAmzHeadersAtComplete: {}
            }, file, {
              status: PENDING,
              priority: 0,
              loadedBytes: 0,
              sizeBytes: file.file.size,
              eTag: ''
            }), fileConfig, self);

        const fileKey = fileUpload.id;

        self.pendingFiles[fileKey] = fileUpload;

        self.queueFile(fileUpload);

        // Resolve or reject the Add promise based on how the fileUpload completes
        fileUpload.deferredCompletion.promise
            .then(
                () => {
                  self.fileCleanup(fileUpload);
                  resolve(decodeURIComponent(fileUpload.name));
                },
                reason => {
                  self.fileCleanup(fileUpload);
                  reject(reason);
                }
            );
      });
    }

    cancel(id) {
      return typeof id === 'undefined' ? this._cancelAll() : this._cancelOne(id);
    }

    _cancelAll() {
      l.d('Canceling all file uploads');
      const promises = [];
      for (const key in this.pendingFiles) {
        if (this.pendingFiles.hasOwnProperty(key)) {
          const file = this.pendingFiles[key];
          if (ACTIVE_STATUSES.includes(file.status)) {
            promises.push(file.stop());
          }
        }
      }
      if (!promises.length) {
        promises.push(Promise.reject('No files to cancel.'));
      }
      return Promise.all(promises);
    }

    _cancelOne(id) {
      const promise = [];
      if (this.pendingFiles[id]) {
        promise.push(this.pendingFiles[id].stop());
      } else {
        promise.push(Promise.reject('File does not exist'));
      }
      return Promise.all(promise);
    }

    pause(id, options = {}) {
      const force = typeof options.force === 'undefined' ? false : options.force;
      return typeof id === 'undefined' ? this._pauseAll(force) : this._pauseOne(id, force);
    }

    _pauseAll(force) {
      l.d('Pausing all file uploads');
      const promises = [];
      for (const key in this.pendingFiles) {
        if (this.pendingFiles.hasOwnProperty(key)) {
          const file = this.pendingFiles[key];
          if (ACTIVE_STATUSES.includes(file.status)) {
            this._pause(file, force, promises);
          }
        }
      }
      return Promise.all(promises);
    }

    _pauseOne(id, force) {
      const promises = [];
      const file = this.pendingFiles[id];
      if (typeof file === 'undefined') {
        promises.push(Promise.reject('Cannot pause a file that has not been added.'));
      } else if (file.status === PAUSED) {
        promises.push(Promise.reject('Cannot pause a file that is already paused.'));
      }
      if (!promises.length) {
        this._pause(file, force, promises);
      }
      return Promise.all(promises);
    }

    _pause(fileUpload, force, promises) {
      promises.push(fileUpload.pause(force));
      removeAtIndex(this.filesInProcess, fileUpload);
      removeAtIndex(this.queuedFiles, fileUpload);
    }

    resume(id) {
      return typeof id === 'undefined' ? this._resumeAll() : this._resumeOne(id);
    }

    _resumeAll() {
      l.d('Resuming all file uploads');
      for (const key in this.pendingFiles) {
        if (this.pendingFiles.hasOwnProperty(key)) {
          const file = this.pendingFiles[key];
          if (PAUSED_STATUSES.includes(file.status))  {
            this.resumeFile(file);
          }
        }
      }
      return Promise.resolve();
    }

    _resumeOne(id) {
      const file = this.pendingFiles[id];
      const promises = [];
      if (typeof file === 'undefined') {
        promises.push(Promise.reject('Cannot pause a file that does not exist.'));
      } else if (!PAUSED_STATUSES.includes(file.status)) {
        promises.push(Promise.reject('Cannot resume a file that has not been paused.'));
      } else {
        this.resumeFile(file);
      }
      return Promise.all(promises);
    }

    resumeFile(fileUpload) {
      fileUpload.resume();
      this.queueFile(fileUpload);
    }

    forceRetry() {}

    consumeRemainingSlots() {
      let avail = this.config.maxConcurrentParts - this.evaporatingCount;
      if (!avail) { return; }
      for (let i = 0; i < this.filesInProcess.length; i++) {
        const file = this.filesInProcess[i];
        const consumed = file.consumeSlots();
        if (consumed < 0) { continue; }
        avail -= consumed;
        if (!avail) { return; }
      }
    }

    validateEvaporateOptions() {
      this.supported = !(
      typeof File === 'undefined' ||
      typeof Promise === 'undefined');

      if (!this.supported) {
        return 'Evaporate requires support for File and Promise';
      }

      if (this.config.readableStreams) {
        if (typeof this.config.readableStreamPartMethod !== 'function') {
          return "Option readableStreamPartMethod is required when readableStreams is set."
        }
      } else  {
        if (typeof Blob === 'undefined' || typeof (
            Blob.prototype.webkitSlice ||
            Blob.prototype.mozSlice ||
            Blob.prototype.slice) === 'undefined') {
          return 'Evaporate requires support for Blob [webkitSlice || mozSlice || slice]';
        }
      }

      if (!this.config.signerUrl && typeof this.config.customAuthMethod !== 'function') {
        return "Option signerUrl is required unless customAuthMethod is present.";
      }

      if (!this.config.bucket) {
        return "The AWS 'bucket' option must be present.";
      }

      if (this.config.computeContentMd5) {
        this.supported = typeof FileReader.prototype.readAsArrayBuffer !== 'undefined';
        if (!this.supported) {
          return 'The browser\'s FileReader object does not support readAsArrayBuffer';
        }

        if (typeof this.config.cryptoMd5Method !== 'function') {
          return 'Option computeContentMd5 has been set but cryptoMd5Method is not defined.'
        }

        if (this.config.awsSignatureVersion === '4') {
          if (typeof this.config.cryptoHexEncodedHash256 !== 'function') {
            return 'Option awsSignatureVersion is 4 but cryptoHexEncodedHash256 is not defined.';
          }
        }
      } else if (this.config.awsSignatureVersion === '4') {
        return 'Option awsSignatureVersion is 4 but computeContentMd5 is not enabled.';
      }
      return true;
    }

    evaporatingCnt(incr) {
      this.evaporatingCount = Math.max(0, this.evaporatingCount + incr);
      this.config.evaporateChanged(this, this.evaporatingCount);
    }
  }

  Evaporate.create = config => {
    const evapConfig = extend({}, config);
    return Evaporate.getLocalTimeOffset(evapConfig)
        .then(offset => {
          evapConfig.localTimeOffset = offset;
          return new Promise((resolve, reject) => {
            const e = new Evaporate(evapConfig);
            if (e.supported === true) {
              resolve(e);
            } else {
              reject(e._instantiationError);
            }
          });
        });
  };
  Evaporate.getLocalTimeOffset = ({localTimeOffset, timeUrl}) => new Promise((resolve, reject) => {
    if (typeof localTimeOffset === 'number') {
      return resolve(localTimeOffset);
    }
    if (timeUrl) {
      const xhr = new XMLHttpRequest();

      xhr.open("GET", `${timeUrl}?requestTime=${new Date().getTime()}`);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            const server_date = new Date(Date.parse(xhr.responseText));
            const offset = server_date - new Date();
            l.d('localTimeOffset is', offset, 'ms');
            resolve(offset);
          }
        }
      };

      xhr.onerror = xhr => {
        l.e('xhr error timeUrl', xhr);
        reject(`Fetching offset time failed with status: ${xhr.status}`);
      };
      xhr.send();
    } else {
      resolve(0);
    }
  });
  Evaporate.prototype.config = {};
  Evaporate.prototype.localTimeOffset = 0;
  Evaporate.prototype.supported = false;
  Evaporate.prototype._instantiationError = undefined;
  Evaporate.prototype.evaporatingCount = 0;
  Evaporate.prototype.pendingFiles = {};
  Evaporate.prototype.filesInProcess = [];
  Evaporate.prototype.queuedFiles = [];

  //http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadComplete.html
  class ReuseS3Object extends SignedS3AWSRequestWithRetryLimit {
    constructor(fileUpload, awsKey) {
      this.awsKey = awsKey;

      fileUpload.info('will attempt to verify existence of the file');

      const request = {
        method: 'HEAD',
        path: '',
        x_amz_headers: fileUpload.xAmzHeadersCommon,
        success404: true,
        step: 'head_object'
      };

      super(fileUpload, request);
    }

    success() {
      const eTag = this.currentXhr.getResponseHeader('Etag');
      if (eTag !== this.fileUpload.eTag &&
          !this.rejectedSuccess('uploadId ', this.fileUpload.id, ' found on S3 but the Etag doesn\'t match.')) { return; }
      this.awsDeferred.resolve(this.currentXhr);
    }
  }

  ReuseS3Object.prototype.awsKey = undefined;

  //http://docs.amazonwebservices.com/AmazonS3/latest/API/mpUploadListParts.html
  class ResumeInterruptedUpload extends SignedS3AWSRequestWithRetryLimit {
    constructor(fileUpload) {
      super(fileUpload);
      this.updateRequest(this.setupRequest(0));
    }

    setupRequest(partNumberMarker) {
      const msg = ['setupRequest() for uploadId:', this.fileUpload.uploadId, 'for part marker:', partNumberMarker].join(" ");
      l.d(msg);

      this.fileUpload.info(msg);

      this.awsKey = this.fileUpload.name;
      this.partNumberMarker = partNumberMarker;

      const request = {
        method: 'GET',
        path: ['?uploadId=', this.fileUpload.uploadId].join(""),
        query_string: `&part-number-marker=${partNumberMarker}`,
        x_amz_headers: this.fileUpload.xAmzHeadersCommon,
        step: 'get upload parts',
        success404: true
      };

      this.request = request;
      return request;
    }

    success() {
      if (this.currentXhr.status === 404) {
        // Success! Upload is no longer recognized, so there is nothing to fetch
        if (this.rejectedSuccess('uploadId ', this.fileUpload.id, ' not found on S3.')) { this.awsDeferred.resolve(this.currentXhr); }
        return;
      }

      const nextPartNumber = this.fileUpload.listPartsSuccess(this, this.currentXhr.responseText);
      if (nextPartNumber) {
        const request = this.setupRequest(nextPartNumber); // let's fetch the next set of parts
        this.updateRequest(request);
        this.trySend();
      } else {
        this.fileUpload.makePartsfromPartsOnS3();
        this.awsDeferred.resolve(this.currentXhr);
      }
    }
  }

  ResumeInterruptedUpload.prototype.awsKey = undefined;
  ResumeInterruptedUpload.prototype.partNumberMarker = 0;
})();