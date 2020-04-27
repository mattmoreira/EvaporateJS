import { SignedS3AWSRequest } from './SignedS3AWSRequest'
import { EVAPORATE_STATUS } from './Constants'

class CancelableS3AWSRequest extends SignedS3AWSRequest {
  errorExceptionStatus() {
    return [EVAPORATE_STATUS.ABORTED, EVAPORATE_STATUS.CANCELED].includes(
      this.fileUpload.status
    )
  }
}
export { CancelableS3AWSRequest }
