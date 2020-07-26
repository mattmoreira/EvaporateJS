import { noOpLogger } from './Utils'
import { HistoryCache } from './HistoryCache'
import { Logger } from './Logger'

type Global = {
  HOURS_AGO: Date
  historyCache: HistoryCache
  l: Logger
}

const Global = {} as Global
Global.l = noOpLogger()
Global.HOURS_AGO = null
Global.historyCache = null

export { Global }
