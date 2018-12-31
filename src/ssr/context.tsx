import { Subtract } from "utility-types";
import { Component, createContext, createElement, ComponentType, SFC } from "react";
import { DataClient } from "../utils/Interfaces";
import createDataClient from "./client";

const React = { createElement }; 
const initialClient: DataClient = createDataClient();
const { Provider, Consumer } = createContext(initialClient);

interface InjectedSSRDataClientProps {
    ssrClient: DataClient
}

export const withSSRDataClient = <P extends InjectedSSRDataClientProps>(Cmp: ComponentType<P>) =>
    class WithSSRDataClient extends Component<Subtract<P, InjectedSSRDataClientProps>, {}> {
        render () {
            const { ...props } = this.props as P;
            return (
                <Consumer>
                    {(client) => <Cmp {...props} ssrClient={client} />}
                </Consumer>
            );
        }
    }

export const SSRDataProvider = Provider;