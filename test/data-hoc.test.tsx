import * as React from "react"
import * as renderer from 'react-test-renderer';
import { AsyncHOC } from '../src/hocs/Async';
import {
  renderToStringWithData,
  createSSRDataClient,
  withSSRDataClient,
  SSRDataProvider
} from '../src/data-hoc';

interface TestResult {
  id: string;
  name: string;
  price: number;
};

interface RenderProps<R> {
  loading: boolean;
  error: string;
  data: R|undefined;
}

const TestHoc = AsyncHOC<string, TestResult>();
function DisplayData ({ loading, error, data }: RenderProps<TestResult>) {
  return loading
  ? <div>Loading...</div>
  : error
  ? <div>{error}</div>
  : data
  ? <div>{data.id} {data.name} {data.price}</div>
  : <div>No result</div>
}

describe('Data HOC', () => {
  it('Should have a Provider component', () => {
    const ssrClient = createSSRDataClient();
    const Child = jest.fn().mockImplementation(() => <div />);
    const WrappedChild = withSSRDataClient(Child);
    const component = renderer.create(
      <SSRDataProvider value={ssrClient}>
        <WrappedChild />
      </SSRDataProvider>,
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    expect(Child).toBeCalledWith({ ssrClient }, {});
  });

  it('Should have an AsyncHOC component', () => {
    const params = "searchTerm";
    const params2 = "searchTerm2";
    const params3 = "searchTerm3";
    const result = { id: "123", name: "Mug", price: 2.99 };
    const result2 = { id: "124", name: "Glass", price: 6.99 };
    const result3 = { id: "125", name: "Plate", price: 10.99 };
    const queryPromise = Promise.resolve(result);
    const query2Promise = Promise.resolve(result2);
    const query3Promise = Promise.resolve(result3);
    console.error = jest.fn();
    const query = jest.fn().mockImplementation((p) => 
      p === params
      ? queryPromise
      : p === params2
      ? query2Promise
      : p === params3
      ? query3Promise
      : Promise.reject(new Error("Not found"))
    );
    const Child = jest.fn().mockImplementation(DisplayData);
    const component = renderer.create(
      <TestHoc name="TestHoc" query={query} params={params}>
        {Child}
      </TestHoc>,
    );
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    expect(Child).toBeCalledWith({ data: undefined, loading: true, error: "" });
    expect(query).toBeCalledWith(params);
    return queryPromise.then(() => {
      tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(Child).toBeCalledWith({ data: result, loading: false, error: "" });
      component.update(
        <TestHoc name="TestHoc" query={query} params={params2}>
          {Child}
        </TestHoc>,
      );
      tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(Child).toBeCalledWith({ data: result, loading: true, error: "" });
      expect(query).toBeCalledWith(params2);
      return queryPromise
    })
    .then(() => {
      tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(Child).toBeCalledWith({ data: result2, loading: false, error: "" });
      component.update(
        <TestHoc name="TestHoc" query={query} params="invalidTerm">
          {Child}
        </TestHoc>,
      );
      tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(Child).toBeCalledWith({ loading: true, error: "", data: result2 });
      expect(query).toBeCalledWith("invalidTerm");
      return queryPromise
    }).then(() => {
      tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(Child).toBeCalledWith({ loading: false, error: "Not found", data: result2 });
      component.update(
        <TestHoc name="TestHoc" query={query} params={params3}>
          {Child}
        </TestHoc>,
      );
      tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(query).toBeCalledWith(params3);
      expect(Child).toBeCalledWith({ loading: true, error: "", data: result2 });
      component.unmount();
    })
    .then(() => {
      expect(console.error).not.toBeCalled();
    });
  });

  it('Should render a loader and then the data', () => {
    const params = "searchTerm";
    const client = createSSRDataClient();
    const result = { id: "123", name: "Mug", price: 2.99 };
    const promise = Promise.resolve(result);
    const query = jest.fn().mockImplementation(() => promise);
    const Child = jest.fn().mockImplementation(DisplayData);
    const component = renderer.create(
      <SSRDataProvider value={client}>
        <TestHoc name="TestHocData" query={query} params={params}>
          {Child}
        </TestHoc>
      </SSRDataProvider>,
    );

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    expect(Child).toBeCalledWith({ data: undefined, loading: true, error: "" });
    expect(query).toBeCalledWith(params);
    return client.isReady().then(() => {
      tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(Child).toBeCalledWith({ data: result, loading: false, error: "" });

      const component1 = renderer.create(
        <SSRDataProvider value={client}>
          <TestHoc name="TestHocData" query={query} params={params}>
            {Child}
          </TestHoc>
        </SSRDataProvider>,
      );

      component1.toJSON()
      expect(component1.toJSON()).toMatchSnapshot();
    })
  })

  it('Should render a loader and then the error', () => {
    const params = "searchTerm";
    const query = jest.fn().mockImplementation(() => Promise.reject(new Error("Not found")));
    const Child = jest.fn().mockImplementation(DisplayData);
    const component = renderer.create(
      <TestHoc name="TestHocDataError" query={query} params={params}>
        {Child}
      </TestHoc>,
    );

    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    expect(Child).toBeCalledWith({ data: undefined, loading: true, error: "" });
    expect(query).toBeCalledWith(params);
    return Promise.resolve()
    .then()
    .then(() => {
      tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(Child).toBeCalledTimes(2);
      expect(Child).toBeCalledWith({ data: undefined, loading: false, error: "Not found" });
    })
  })

  it('Should not render data if unmounted', () => {
    const params = "searchTerm";
    const result = { id: "123", name: "Mug", price: 2.99 };
    const promise = Promise.resolve(result);
    const query = jest.fn().mockImplementation(() => promise);
    const Child = jest.fn().mockImplementation(DisplayData);
    console.error = jest.fn();
    const component = renderer.create(
      <TestHoc name="TestHocDataUnmount" query={query} params={params}>
        {Child}
      </TestHoc>,
    );
    
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    expect(Child).toBeCalledWith({ data: undefined, loading: true, error: "" });
    expect(query).toBeCalledWith(params);
    component.unmount();
    return promise.then(() => {
      tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(Child).not.toBeCalledWith({ data: undefined, loading: false, error: "Not found" });
      expect(console.error).not.toBeCalled();
    })
  });

  it('Should not render error if unmounted', () => {
    const params = "searchTerm";
    const query = jest.fn().mockImplementation(() => Promise.reject(new Error("Not found")));
    const Child = jest.fn().mockImplementation(DisplayData);
    console.error = jest.fn();
    const component = renderer.create(
      <TestHoc name="TestHocErrorUnmount" query={query} params={params}>
        {Child}
      </TestHoc>,
    );
    
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    expect(Child).toBeCalledWith({ data: undefined, loading: true, error: "" });
    expect(query).toBeCalledWith(params);
    component.unmount();
    return Promise.resolve().then(() => {
      tree = component.toJSON();
      expect(tree).toMatchSnapshot();
      expect(Child).not.toBeCalledWith({ data: undefined, loading: false, error: "Not found" });
      expect(console.error).not.toBeCalled();
    })
  });

  it('Should implement server rendering', () => {
    const data = {};
    const client = createSSRDataClient(data, { ssr: true });
    return client.isReady()
    .then(() => {
      expect(client.extract()).toBe(data);
    })
  });

  it('Should wait for requests', () => {
    const data = {};
    const client = createSSRDataClient(data, { ssr: true });
    client.makeRequest("test", () => Promise.resolve(1), "searchTerm");
    return client.isReady()
    .then(() => {
      expect(client.extract()).toEqual({
        "test(\"searchTerm\")": 1
      });
    })
  });

  it('Should error if not supplied a function', () => {
    const a = "" as unknown as () => React.ReactNode;
    const query = () => Promise.resolve({ id: "123", name: "Mug", price: 2.99 });
    expect(() => renderer.create(
      <TestHoc name="InvalidChild" query={query} params={"term"}>
        {a}
      </TestHoc>
    )).toThrowError("children must be a function");
  })

  it('Should wait for nested requests', () => {
    const data = {};
    const params1 = "searchTerm";
    const result1 = { id: "123", name: "Mug", price: 2.99 };
    const query1 = () => Promise.resolve(result1)
    const result2 = { id: "124", name: "Glass", price: 6.99 };
    const query2 = () => Promise.resolve(result2)
    const client = createSSRDataClient(data, { ssr: true });
    const Child = jest.fn().mockImplementation(DisplayData);
    client.makeRequest = jest.fn().mockImplementation(client.makeRequest);
    const ServerApp = () => (
      <SSRDataProvider value={client}>
        <TestHoc name="RequestOne" params={params1} query={query1}>
          {({ data }) => {
            return data
            ? <TestHoc name="RequestTwo" params={data.id} query={query2}>
                {Child}
              </TestHoc>
            : <div>Loading</div>
          }}
        </TestHoc>
      </SSRDataProvider>
    );

    return renderToStringWithData(client, ServerApp)
    .then((content) => {
      expect(content).toMatchSnapshot();
      expect(client.makeRequest).toBeCalledTimes(2);
      expect(client.makeRequest).toHaveBeenCalledWith("RequestOne", query1, params1);
      expect(client.makeRequest).toHaveBeenCalledWith("RequestTwo", query2, result1.id);
      expect(client.getCached("RequestOne", "searchTerm")).toBe(result1);
      expect(client.getCached("RequestTwo", "123")).toBe(result2);
      expect(client.extract()).toEqual({
        "RequestOne(\"searchTerm\")": result1,
        "RequestTwo(\"123\")": result2,
      });
    })
  })
});
