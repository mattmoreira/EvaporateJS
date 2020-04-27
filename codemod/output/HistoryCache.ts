declare function $_$twiz(name: string, value: any, pos: number, filename: string, opts: any): void;
declare namespace $_$twiz {
    function track<T>(value: T, filename: string, offset: number): T;
    function track(value: any, filename: string, offset: number): any;
}
class HistoryCache {
  public cacheStore: any
  supported: boolean = false

  static supported(): boolean {
    const result = false

    if (typeof window !== 'undefined') {
      if (!('localStorage' in window)) {
        return result
      }
    } else {
      return result
    }

    // Try to use storage (it might be disabled, e.g. user is in private mode)
    try {
      const k = '___test'
      localStorage[k] = 'OK'
      const test = localStorage[k]
      delete localStorage[k]
      return test === 'OK'
    } catch (e) {
      return result
    }
  }

  constructor(mockLocalStorage) {
    const supported = HistoryCache.supported()
    this.cacheStore = mockLocalStorage
      ? {}
      : supported
      ? localStorage
      : undefined
  }

  getItem(key) {
    if (this.cacheStore) {
      return this.cacheStore[key]
    }
  }

  setItem(key, value) {
    if (this.cacheStore) {
      this.cacheStore[key] = value
    }
  }

  removeItem(key) {
    if (this.cacheStore) {
      return delete this.cacheStore[key]
    }
    getItem(key) { $_$twiz("key", key, 312, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/HistoryCache.ts", "{}"); if (this.cacheStore) {
        return this.cacheStore[key];
    } }
    setItem(key, value) { $_$twiz("key", key, 402, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/HistoryCache.ts", "{}"); $_$twiz("value", value, 409, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/HistoryCache.ts", "{}"); if (this.cacheStore) {
        this.cacheStore[key] = value;
    } }
    removeItem(key) { $_$twiz("key", key, 503, "/Users/matheus.moreira/Projetos/open-source/EvaporateJS/codemod/output/HistoryCache.ts", "{}"); if (this.cacheStore) {
        return delete this.cacheStore[key];
    } }
}

export { HistoryCache }
