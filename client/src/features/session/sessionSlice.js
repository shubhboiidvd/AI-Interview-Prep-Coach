import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

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
  async ({ questionId, provider }, { getState }) => {
    const response = await sessionRequest(
      `/qa/${questionId}/rescore`,
      "POST",
      { provider },
      getState().auth.token,
    );
    return response;
  },
);

const initialState = {
  currentSession: null,
  currentQuestion: null,
  chatHistory: [],
  status: "idle",
  error: null,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    receiveFeedback: (state, action) => {
      state.chatHistory.push(action.payload);
    },
    receiveNextQuestion: (state, action) => {
      state.currentQuestion = action.payload;
      state.chatHistory.push({
        type: "question",
        content: action.payload.questionText,
        ...action.payload,
      });
    },
    resetSession: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(startSession.pending, (state) => {
      state.status = "loading";
      state.error = null;
      state.chatHistory = [];
    });
    builder.addCase(startSession.fulfilled, (state, action) => {
      state.currentSession = action.payload.session;
      state.currentQuestion = action.payload.firstQuestion;
      state.chatHistory = [];
      state.chatHistory.push({
        type: "question",
        content: action.payload.firstQuestion.questionText,
        ...action.payload.firstQuestion,
      });
      state.status = "awaiting-answer";
    });
    builder.addCase(startSession.rejected, (state, action) => {
      state.status = "idle";
      state.error = action.error.message;
    });
    builder.addCase(submitAnswer.pending, (state, action) => {
      state.status = "evaluating";
      state.chatHistory.push({
        type: "answer",
        content: action.meta.arg.answerText,
        answerMethod: action.meta.arg.answerMethod,
        timestamp: new Date().toISOString(),
      });
    });
    builder.addCase(submitAnswer.fulfilled, (state, action) => {
      state.chatHistory.push({
        ...action.payload.feedback,
        content: action.payload.feedback.content,
        type: "feedback",
      });
      if (action.payload.sessionComplete) {
        state.status = "complete";
        state.currentQuestion = null;
      } else {
        state.currentQuestion = action.payload.nextQuestion;
        state.chatHistory.push({
          type: "question",
          content: action.payload.nextQuestion.questionText,
          ...action.payload.nextQuestion,
        });
        state.status = "awaiting-answer";
      }
    });
    builder.addCase(submitAnswer.rejected, (state, action) => {
      state.status = "awaiting-answer";
      state.error = action.error.message;
    });
    builder.addCase(completeSession.pending, (state) => {
      state.status = "evaluating";
    });
    builder.addCase(completeSession.fulfilled, (state, action) => {
      state.currentSession = action.payload.session;
      state.currentSession.summary = action.payload.summary;
      state.status = "complete";
    });
    builder.addCase(completeSession.rejected, (state, action) => {
      state.status = "complete";
      state.error = action.error.message;
    });
    builder.addCase(rescoreAnswer.fulfilled, (state, action) => {
      const feedback = action.payload.feedback;
      const item = state.chatHistory.find(
        (message) =>
          message.questionId === String(action.payload._id) ||
          message.questionId === action.payload._id,
      );
      if (item) {
        item.content = feedback;
        item.score = action.payload.score;
      }
    });
    builder.addCase(rescoreAnswer.rejected, (state, action) => {
      state.error = action.error.message;
    });
  },
});

export const { receiveFeedback, receiveNextQuestion, resetSession } =
  sessionSlice.actions;
export default sessionSlice.reducer;
