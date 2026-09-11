import { combineReducers } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import authReducer from "../features/auth/reducer";
import sessionReducer from "../features/session/reducer";
import voiceReducer from "../features/voice/reducer";

export const rootReducer = combineReducers({
  auth: authReducer,
  session: sessionReducer,
  voice: voiceReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});
