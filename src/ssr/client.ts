import tokenize from '../utils/tokenize'
import defer from '../utils/defer'
import { DataClient, DataStore, DataClientOptions } from '../utils/Interfaces'

const defaultOptions: DataClientOptions = {
  ssr: false
}

function waitForNextRender<P>(v: P) {
  return new Promise(res => setImmediate(() => res(v)))
}

export default (
  dataStore: DataStore = {},
  options: DataClientOptions = defaultOptions
): DataClient => {
  const activeRequests = new Set()
  let isReady = defer<DataStore>()

  return {
    makeRequest: (name, fn, params) => {
      const token = tokenize(name, params)
      const request = fn(params)
      activeRequests.add(request)
      request
        .then(waitForNextRender)
        .then(v => {
          dataStore[token] = v
          activeRequests.delete(request)
          if (!activeRequests.size) isReady.resolve(dataStore)
        })
        .catch(() => null)

      if (options.ssr) {
        return new Promise(() => null)
      }

      return request
    },
    getCached: (name, params) => {
      const token = tokenize(name, params)
      return dataStore[token]
    },
    extract: () => dataStore,
    size: () => activeRequests.size,
    isReady: () => {
      isReady = defer<DataStore>()
      if (!activeRequests.size) isReady.resolve(dataStore)
      return isReady.promise
    }
  }
}
