import { Component, ReactNode } from "react";
import takeLatest from "../utils/takeLatest";
import { withSSRDataClient } from "../ssr/context";
import { DataClient, DataRequestCb } from "../utils/Interfaces";

interface Props<P, R, S> {
    children: (state: S) => ReactNode;
    ssrClient: DataClient|undefined;
    name: string;
    query: DataRequestCb<P, R>;
    params: P;
}

interface S<R> {
    loading: boolean;
    error: string;
    data: R|undefined;
}

class Async<P, R> extends Component<Props<P, R, S<R>>, S<R>> {
    constructor (props: Props<P, R, S<R>>) {
        super(props);
        const { ssrClient, name, params } = props;
        const data = ssrClient && ssrClient.getCached<P, R>(name, params)
        this.state = {
            loading: !data,
            error: "",
            data,
        };
    }
    makeRequest: DataRequestCb<P, R> = (params: P) => {
        const { ssrClient, name, query } = this.props;
        if (ssrClient) return ssrClient.makeRequest(name, query, params);
        return query(params);
    }
    runLatestQuery = takeLatest<P, R>(
        this.makeRequest, 
        (data) => this.setState({ loading: false, data }), 
        (e) => this.setState({ loading: false, error: e.message }),
    );
    componentWillMount() {
        if (!this.state.data) this.runLatestQuery(this.props.params);
    }
    componentWillUpdate(nextProps: any) {
        if (this.props.params !== nextProps.params) {
            this.setState({ loading: true, error: "" })
            this.runLatestQuery(nextProps.params);
        }
    }
    componentWillUnmount() {
        this.runLatestQuery.cancel();
    }
    render() {
        const { children } = this.props;
        if (typeof children !== "function") throw new Error("children must be a function");
        return children(this.state);
    }
};

export default withSSRDataClient(Async);