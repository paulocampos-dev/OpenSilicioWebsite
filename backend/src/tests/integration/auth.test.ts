import request from "supertest";
import app from "../../server";
import { getAuthToken } from "../utils/auth";

describe("Auth API", () => {
  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "AdmOpen",
        password: "Dev123!@LocalOnly",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("username");
      expect(response.body.user.username).toBe("AdmOpen");
    });

    it("should reject invalid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "AdmOpen",
        password: "WrongPassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject missing credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "AdmOpen",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/auth/verify", () => {
    it("should verify valid token", async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .get("/api/auth/verify")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("valid", true);
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/api/auth/verify");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/verify")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });
});
