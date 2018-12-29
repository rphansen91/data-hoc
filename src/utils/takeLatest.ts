import { DataRequestCb } from './Interfaces'

interface Latest<P> {
  (params: P): Promise<void>
  cancel: () => void
  resume: () => void
}

export default function takeLatest<P, R>(
  fn: DataRequestCb<P, R>,
  onSuccess: (v: R) => void,
  onError: (e: any) => void
): Latest<P> {
  let canceled = false
  let latestargs: P

  function stash(params: P) {
    latestargs = params

    return (v: R) => {
      if (!canceled && latestargs === params) {
        onSuccess(v)
      }
    }
  }

  const latest: any = (params: P) => {
    return fn(params)
      .then(stash(params))
      .catch(e => {
        if (!canceled) onError(e)
      })
  }

  latest.cancel = () => {
    canceled = true
  }
  latest.resume = () => {
    canceled = false
  }

  return latest
}
