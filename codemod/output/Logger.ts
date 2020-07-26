interface DefaultLogger {
  d: Function
  w: Function
  e: Function
}

export type Logger = DefaultLogger & Partial<Console>
