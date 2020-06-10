import React, { FC, createContext, useContext, useState, useEffect } from "react";
import { parse, stringify } from 'querystring'

export const contextControllerHOC = <A extends {}, C extends {}>(
  useControlsFactory: (args: A) => C
) => {
  const Context = createContext<C | null>(null);
  const Provider: FC<A> = ({ children, ...rest }) => {
    const controls = useControlsFactory(rest as A);
    return <Context.Provider value={controls}>{children}</Context.Provider>;
  };
  const useControls = () => {
    const controls = useContext(Context);
    if (!controls) throw new Error(`${useControlsFactory.name} no provider found.`);
    return controls;
  };

  return {
    Context,
    Provider,
    useControls,
  };
};

export function useUrlState(name: string, initial?: string|string[]): [string|string[]|undefined, (v: string|string[]|undefined) => void] {
  const qs = window.location.search.replace(/^\?/, '')
  const params = parse(qs)
  const [state, setState] = useState(params[name] ?? initial) 
  const setUrlState = (value: undefined | string | string[]) => {
    const url = window.location.protocol + "//" + window.location.host + window.location.pathname;
    const params = parse(qs)
    const search = stringify({ ...params, [name]: value })
    const path = [url, search].filter(v => v).join('?')
    window.history.pushState({ path }, '', path)
    setState(value)
  }
  return [state, setUrlState]
}

interface IAsyncState<V> {
  data: V|null;
  loading: boolean;
  error: string;
}

interface IAsyncActions<V> {
  setLoading: () => void,
  setError: (error: string) => void,
  setData: (data: V) => void,
}

export function useAsyncState<V>(): [IAsyncState<V>, IAsyncActions<V>] {
  const [state, setState] = useState<IAsyncState<V>>({ data: null, loading: false, error: "" });
  const setLoading = () => setState({ data: null, loading: true, error: '' })
  const setData = (data: V) => setState({ data, loading: false, error: '' })
  const setError = (error: string) => setState({ data: null, loading: false, error })
  return [state, { setLoading, setData, setError }]
}

export function useAsyncEffect<V>(fn: () => Promise<V>, args: any[]): IAsyncState<V> {
  const [state, { setLoading, setData, setError }] = useAsyncState<V>()

  useEffect(() => {
    setLoading()
    fn()
    .then((data) => setData(data))
    .catch((err) => setError(err.message))
  }, args)

  return state
}

export function tuple<A, B>(a: A, b: B): [A, B] {
  return [a, b]
}