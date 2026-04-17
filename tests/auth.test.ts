import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("auth validation", () => {
  it("rejects invalid registration payload", async () => {
    const app = createApp();
    const response = await request(app).post("/api/v1/auth/register").send({
      name: "A",
      email: "bad",
      password: "short",
      languagePreference: "en"
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
