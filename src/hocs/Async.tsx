import { Component, ReactNode } from "react";
import takeLatest from "../utils/takeLatest";
import { withSSRDataClient } from "../ssr/context";
import { DataClient, DataRequestCb } from "../utils/Interfaces";

interface Props<Params, Response, Values> {
    children: (values: Values) => ReactNode;
    ssrClient: DataClient;
    name: string;
    query: DataRequestCb<Params, Response>;
    params: Params;
}

interface Values<Response> {
    loading: boolean;
    error: string;
    data: Response|undefined;
}

class Async<Params, Response> extends Component<Props<Params, Response, Values<Response>>> {
    currentValues: Values<Response>;
    constructor (props: Props<Params, Response, Values<Response>>) {
        super(props);
        const { ssrClient, name, params } = props;
        const data = ssrClient && ssrClient.getCached<Params, Response>(name, params)
        this.currentValues = {
            loading: !data,
            error: "",
            data,
        };
    }
    makeRequest: DataRequestCb<Params, Response> = (params: Params) => {
        const { ssrClient, name, query } = this.props;
        return ssrClient.makeRequest(name, query, params);
    }
    runLatestQuery = takeLatest<Params, Response>(
        this.makeRequest, 
        (data) => this.updateValues({ loading: false, data, error: "" }), 
        (e) => this.updateValues({ loading: false, data: this.currentValues.data, error: e.message }),
    );
    componentWillMount() {
        if (!this.currentValues.data) {
            this.runLatestQuery(this.props.params);
        }
    }
    componentWillUpdate(nextProps: any) {
        if (this.props.params !== nextProps.params) {
            this.updateValues({ loading: true, data: this.currentValues.data, error: "" });
            this.runLatestQuery(nextProps.params);
        }
    }
    componentWillUnmount() {
        this.runLatestQuery.cancel();
    }
    updateValues (values: Values<Response>) {
        this.currentValues = values;
        this.forceUpdate();
    }
    render() {
        const { children } = this.props;
        if (typeof children !== "function") {
            throw new Error("children must be a function");
        }
        return children(this.currentValues);
    }
};

export function AsyncHOC<Params, Response> () {
    return withSSRDataClient<Props<Params, Response, Values<Response>>>(Async);
}

export default withSSRDataClient(Async);