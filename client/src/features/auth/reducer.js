import { createReducer } from "@reduxjs/toolkit";
import {
  loadUser,
  loadUserFromStorage,
  login,
  loginUser,
  logout,
  register,
  registerUser,
} from "./actions";

const storedToken = localStorage.getItem("token");

export const initialState = {
  user: null,
  token: storedToken,
  isAuthenticated: Boolean(storedToken),
  status: "idle",
  error: null,
};

const authReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(login, (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem("token", action.payload.token);
    })
    .addCase(register, (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem("token", action.payload.token);
    })
    .addCase(logout, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
    })
    .addCase(loadUserFromStorage, (state) => {
      const token = localStorage.getItem("token");
      state.token = token;
      state.isAuthenticated = Boolean(token);
    });

  [loginUser, registerUser].forEach((thunk) => {
    builder
      .addCase(thunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(thunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(thunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  });

  builder
    .addCase(loadUser.pending, (state) => {
      state.status = "loading";
    })
    .addCase(loadUser.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.user = action.payload;
      state.isAuthenticated = true;
    })
    .addCase(loadUser.rejected, (state, action) => {
      state.status = "failed";
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = action.payload || action.error.message;
      localStorage.removeItem("token");
    });
});

export default authReducer;
