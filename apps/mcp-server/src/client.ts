// SPDX-License-Identifier: MIT
/** Thin authenticated HTTP client for the Folio editor API. */
import type { Plan, RequestCall } from "./tools.js";

export type FolioClientConfig = { baseUrl: string; token: string };

export class FolioClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(config: FolioClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.token = config.token;
  }

  private async call({ method, path, body }: RequestCall): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${this.token}`,
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      // non-JSON response; keep raw text
    }
    if (!res.ok) {
      const detail =
        parsed && typeof parsed === "object" && "error" in parsed
          ? (parsed as { error: unknown }).error
          : res.statusText;
      throw new Error(`Folio API ${method} ${path} failed (${res.status}): ${String(detail)}`);
    }
    return parsed;
  }

  /** Execute a plan's calls in order; return the last call's result. */
  async run(plan: Plan): Promise<unknown> {
    let result: unknown = null;
    for (const c of plan.calls) result = await this.call(c);
    return result;
  }
}
