import type { AxiosAdapter, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosError } from "axios";

export type Reply = { status: number; data?: unknown } | Error;

function reply(
  config: InternalAxiosRequestConfig,
  { status, data }: { status: number; data?: unknown },
) {
  const response: AxiosResponse = { status, statusText: "", data, headers: {}, config };
  if (status >= 400) {
    throw new AxiosError("Request failed", undefined, config, undefined, response);
  }
  return response;
}

// Routes requests by URL to queued replies, recording every request the client sends.
export function createFakeAdapter(routes: Record<string, Reply[]>) {
  const sent: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    sent.push(config);
    const next = routes[config.url ?? ""]?.shift();
    if (!next) throw new Error(`Unexpected request to ${config.url}`);
    if (next instanceof Error) throw next;
    return reply(config, next);
  };
  return { adapter, sent };
}

/** Points a module-level client (e.g. `api`) at a fake adapter; call `restore` after the test. */
export function installFakeAdapter(client: AxiosInstance, routes: Record<string, Reply[]>) {
  const original = client.defaults.adapter;
  const fake = createFakeAdapter(routes);
  client.defaults.adapter = fake.adapter;
  return {
    ...fake,
    restore() {
      client.defaults.adapter = original;
    },
  };
}

export function requestsTo(sent: readonly InternalAxiosRequestConfig[], url: string) {
  return sent.filter((config) => config.url === url);
}

export function bodyOf(config: InternalAxiosRequestConfig | undefined): unknown {
  return typeof config?.data === "string" ? JSON.parse(config.data) : config?.data;
}

export function errorBody(code: string, message = code) {
  return { error: { code, message, request_id: "req-test" } };
}
