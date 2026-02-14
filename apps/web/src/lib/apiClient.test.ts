import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpApiClient } from "./apiClient";

const phone = "+12025550123";

function mockOkResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

describe("HttpApiClient URL resolution", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prefixes /api/v1 when base URL has no path", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockOkResponse({ message: "OTP sent" })
    );
    const client = new HttpApiClient("http://localhost:8080");

    await client.requestOtp(phone);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:8080/api/v1/auth/otp/request");
  });

  it("does not duplicate /api/v1 when already present in base URL", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockOkResponse({ message: "OTP sent" })
    );
    const client = new HttpApiClient("http://localhost:8080/api/v1");

    await client.requestOtp(phone);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:8080/api/v1/auth/otp/request");
  });
});
