import { noOpLogger } from './Utils'
import { HistoryCache } from './HistoryCache'

type Global = {
  HOURS_AGO: Date
  historyCache: HistoryCache
  l: {
    d: Function
    w: Function
    e: Function
  }
}

const Global = {} as Global
Global.l = noOpLogger()
Global.HOURS_AGO = null
Global.historyCache = null
export { Global }
