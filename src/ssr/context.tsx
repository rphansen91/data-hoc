// import { Subtract } from "utility-types";
import { Component, createContext, createElement, ComponentType, SFC } from "react";
import { DataClient } from "../utils/Interfaces";
import createDataClient from "./client";

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

const React = { createElement }; 
const initialClient: DataClient = createDataClient();
const { Provider, Consumer } = createContext(initialClient);

interface InjectedSSRDataClientProps {
    ssrClient: DataClient
}

export const withSSRDataClient = <P extends InjectedSSRDataClientProps>(
    Cmp: ComponentType<P & InjectedSSRDataClientProps>
) =>
    class WithSSRDataClient extends Component<Exclude<keyof P, keyof InjectedSSRDataClientProps>> {
        render () {
            const props = this.props as unknown as P;
            return (
                <Consumer>
                    {(client) => <Cmp {...props} ssrClient={client} />}
                </Consumer>
            );
        }
    }

export const SSRDataProvider = Provider;