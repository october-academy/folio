// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { ACCESS_EMAIL_HEADER, authModeOf, roleForNewUser } from "./auth-util";

describe("auth-util", () => {
  test("authModeOf defaults to token, only 'access' opts in", () => {
    expect(authModeOf(undefined)).toBe("token");
    expect(authModeOf(null)).toBe("token");
    expect(authModeOf("token")).toBe("token");
    expect(authModeOf("ACCESS")).toBe("token"); // exact match only
    expect(authModeOf("access")).toBe("access");
  });

  test("roleForNewUser makes the first user an admin", () => {
    expect(roleForNewUser(0)).toBe("admin");
    expect(roleForNewUser(1)).toBe("user");
    expect(roleForNewUser(42)).toBe("user");
  });

  test("access email header is the Cloudflare Access one", () => {
    expect(ACCESS_EMAIL_HEADER).toBe("cf-access-authenticated-user-email");
  });
});
