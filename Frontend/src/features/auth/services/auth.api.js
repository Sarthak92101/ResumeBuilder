import axios from "axios";

const api = axios.create({
  baseURL: "https://resumebuilder-backend-aidf.onrender.com", // ✅ FIXED
  withCredentials: true,
});

export async function register({ username, email, password }) {
  try {
    const response = await api.post("/api/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  } catch (err) {
    console.log(err);
  }
}

export async function login({ email, password }) {
  try {
    const response = await api.post("/api/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (err) {
    console.error("Login API error:", err);
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

export async function logout() {
  try {
    const response = await api.get("/api/auth/logout");
    return response.data;
  } catch (err) {
    console.log(err);
  }
}

export async function me() {
  try {
    const response = await api.get("/api/auth/me");
    return response.data;
  } catch (err) {
    console.log(err);
  }
}
