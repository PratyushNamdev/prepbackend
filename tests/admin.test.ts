import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("admin route protection", () => {
  it("requires authentication for admin health", async () => {
    const response = await request(createApp()).get("/api/v1/admin/health");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });
});
