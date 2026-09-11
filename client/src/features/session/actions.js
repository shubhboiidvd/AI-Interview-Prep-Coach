import { createAction, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function sessionRequest(path, method, body, token) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Session request failed");
  return data;
}

export const receiveFeedback = createAction("session/receiveFeedback");
export const receiveNextQuestion = createAction("session/receiveNextQuestion");
export const resetSession = createAction("session/resetSession");

export const startSession = createAsyncThunk(
  "session/startSession",
  async (setup, { getState }) =>
    sessionRequest("/sessions", "POST", setup, getState().auth.token),
);
export const submitAnswer = createAsyncThunk(
  "session/submitAnswer",
  async ({ answerText, answerMethod = "text" }, { getState }) => {
    const { currentSession, currentQuestion } = getState().session;
    return sessionRequest(
      `/sessions/${currentSession._id}/answer`,
      "POST",
      { questionId: currentQuestion.id, answerText, answerMethod },
      getState().auth.token,
    );
  },
);
export const completeSession = createAsyncThunk(
  "session/completeSession",
  async (_, { getState }) => {
    const { currentSession } = getState().session;
    return sessionRequest(
      `/sessions/${currentSession._id}/complete`,
      "POST",
      null,
      getState().auth.token,
    );
  },
);
export const rescoreAnswer = createAsyncThunk(
  "session/rescoreAnswer",
  async ({ questionId, provider }, { getState }) =>
    sessionRequest(
      `/qa/${questionId}/rescore`,
      "POST",
      { provider },
      getState().auth.token,
    ),
);
