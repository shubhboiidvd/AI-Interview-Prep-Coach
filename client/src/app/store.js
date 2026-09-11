import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import authReducer from "../features/auth/authSlice";
import sessionReducer from "../features/session/sessionSlice";
import voiceReducer from "../features/voice/voiceSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    session: sessionReducer,
    voice: voiceReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
});
