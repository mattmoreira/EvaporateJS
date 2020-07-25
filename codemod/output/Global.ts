import { noOpLogger } from './Utils'
import { HistoryCache } from './HistoryCache'

interface DefaultLogger {
  d: Function
  w: Function
  e: Function
}

type Logger = DefaultLogger & Partial<Console>

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
