import React, { createContext } from "react";
import createDataClient from "./client";
import { DataClient } from "../utils/Interfaces";

const initialClient: DataClient = createDataClient();
const { Provider, Consumer } = createContext(initialClient);

export function withSSRDataClient<P> (Cmp: any) {
    return (props: P) => (
        <Consumer>
            {(client) => <Cmp {...props} ssrClient={client} />}
        </Consumer>
    );
}
export const SSRDataProvider = Provider;