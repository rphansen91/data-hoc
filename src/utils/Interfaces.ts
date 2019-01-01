export type DataRequestCb<P, R> = (params: P) => Promise<R>

export interface DataStore {
  [token: string]: any
}

export interface DataClientOptions {
  ssr?: boolean
  debug?: boolean
}

export interface DataClient {
  makeRequest<P, R>(name: string, cb: DataRequestCb<P, R>, params: P): Promise<R>
  getCached<P, R>(name: string, params: P): R | undefined
  extract(): DataStore
  size(): number
  isReady(): Promise<DataStore>
}
