import { createAction, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function requestAuth(path, credentials) {
  const response = await fetch(`${API_URL}/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Authentication failed");
  return data;
}

export const login = createAction("auth/login");
export const register = createAction("auth/register");
export const logout = createAction("auth/logout");
export const loadUserFromStorage = createAction("auth/loadUserFromStorage");

export const loginUser = createAsyncThunk("auth/loginUser", (credentials) =>
  requestAuth("login", credentials),
);
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  (credentials) => requestAuth("register", credentials),
);
export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { getState, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${getState().auth.token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);
