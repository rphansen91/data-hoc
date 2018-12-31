interface Defered<T> {
  promise: Promise<T>
  resolve: (value: T | undefined) => void
  reject: (error: any) => void
}

export default function defer<T>(): Defered<T> {
  let resolve: (value: T | undefined) => void = () => null
  let reject: (error: any) => void = () => null
  const promise = new Promise<T>((res, rej) => {
    resolve(undefined)
    reject(undefined)
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
