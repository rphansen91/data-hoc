import tokenize from '../utils/tokenize'
import defer from '../utils/defer'
import { DataClient, DataStore, DataClientOptions } from '../utils/Interfaces'

const defaultOptions: DataClientOptions = {
  ssr: false
}

export default (
  dataStore: DataStore = {},
  options: DataClientOptions = defaultOptions
): DataClient => {
  const activeRequests = new Set()
  const isReady = defer<DataStore>()

  return {
    makeRequest: (name, fn, params) => {
      const token = tokenize(name, params)
      const request = fn(params)
      activeRequests.add(request)
      request.then(v => {
        dataStore[token] = v
        activeRequests.delete(request)
        if (!activeRequests.size) isReady.resolve(dataStore)
      })

      if (options.ssr) {
        // Never resolve server will extract data on ready
        return new Promise(() => null)
      }
      return request
    },
    getCached: (name, params) => {
      const token = tokenize(name, params)
      return dataStore[token]
    },
    extract: () => dataStore,
    isReady: () => {
      if (!activeRequests.size) isReady.resolve(dataStore)
      return isReady.promise
    }
  }
}
