import request from "supertest";
import app from "../../server";
import { testPool } from "../setup";

const TEST_USERNAME = "AdmOpen";
const TEST_PASSWORD = "Dev123!@LocalOnly";

/**
 * Get authentication token for testing
 * Uses the same login endpoint as the frontend would
 */
export const getAuthToken = async (): Promise<string> => {
  const response = await request(app).post("/api/auth/login").send({
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
  });

  if (response.status !== 200) {
    throw new Error(
      `Failed to get auth token: ${response.body.error || response.body.message}`,
    );
  }

  return response.body.token;
};

/**
 * Create an authenticated request helper
 */
export const authenticatedRequest = async () => {
  const token = await getAuthToken();
  return {
    token,
    request: request(app),
    get: (url: string) =>
      request(app).get(url).set("Authorization", `Bearer ${token}`),
    post: (url: string) =>
      request(app).post(url).set("Authorization", `Bearer ${token}`),
    put: (url: string) =>
      request(app).put(url).set("Authorization", `Bearer ${token}`),
    delete: (url: string) =>
      request(app).delete(url).set("Authorization", `Bearer ${token}`),
  };
};
