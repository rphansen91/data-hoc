interface Defered<T> {
  promise: Promise<T>
  resolve: (value: T | undefined) => void
  reject: (error: any) => void
}

export default function defer<T>(): Defered<T> {
  let resolved: T | undefined
  let rejected: any
  let resolve = (v: T | undefined) => {
    resolved = v
  }
  let reject = (e: any) => {
    rejected = e
  }
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
    if (rejected) reject(rejected)
    else if (resolved) resolve(resolved)
  })
  return { promise, resolve, reject }
}
