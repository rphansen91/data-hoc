import { ComponentType, createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { DataClient } from '../utils/Interfaces'

const React = { createElement }

export default function renderToStringWithData (client: DataClient, App: ComponentType): Promise<string> {
    const content = renderToString(<App />)
  
    if (!client.size()) return Promise.resolve(content);
  
    return client.isReady()
    .then(() => {
        return renderToStringWithData(client, App)
    })
}