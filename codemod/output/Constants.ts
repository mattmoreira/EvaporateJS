const FAR_FUTURE: Date = new Date('2060-10-22')

enum EVAPORATE_STATUS {
  PENDING = 0,
  EVAPORATING = 2,
  COMPLETE = 3,
  PAUSED = 4,
  CANCELED = 5,
  ERROR = 10,
  ABORTED = 20,
  PAUSING = 30
}

const PAUSED_STATUSES = [EVAPORATE_STATUS.PAUSED, EVAPORATE_STATUS.PAUSING]
const ACTIVE_STATUSES = [
  EVAPORATE_STATUS.PENDING,
  EVAPORATE_STATUS.EVAPORATING,
  EVAPORATE_STATUS.ERROR
]

const ETAG_OF_0_LENGTH_BLOB = '"d41d8cd98f00b204e9800998ecf8427e"'
const PARTS_MONITOR_INTERVAL_MS: number = 2 * 60 * 1000

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
] as const

const S3_EXTRA_ENCODED_CHARS = {
  // !
  33: '%21',

  // '
  39: '%27',

  // (
  40: '%28',

  // )
  41: '%29',

  // *
  42: '%2A'
}

export {
  FAR_FUTURE,
  PAUSED_STATUSES,
  ACTIVE_STATUSES,
  ETAG_OF_0_LENGTH_BLOB,
  PARTS_MONITOR_INTERVAL_MS,
  IMMUTABLE_OPTIONS,
  EVAPORATE_STATUS,
  S3_EXTRA_ENCODED_CHARS
}
