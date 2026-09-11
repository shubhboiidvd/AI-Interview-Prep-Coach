import { createReducer } from "@reduxjs/toolkit";
import {
  completeSession,
  receiveFeedback,
  receiveNextQuestion,
  resetSession,
  rescoreAnswer,
  startSession,
  submitAnswer,
} from "./actions";

export const initialState = {
  currentSession: null,
  currentQuestion: null,
  chatHistory: [],
  status: "idle",
  error: null,
};

const sessionReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(receiveFeedback, (state, action) => {
      state.chatHistory.push(action.payload);
    })
    .addCase(receiveNextQuestion, (state, action) => {
      state.currentQuestion = action.payload;
      state.chatHistory.push({
        type: "question",
        content: action.payload.questionText,
        ...action.payload,
      });
    })
    .addCase(resetSession, () => initialState)
    .addCase(startSession.pending, (state) => {
      state.status = "loading";
      state.error = null;
      state.chatHistory = [];
    })
    .addCase(startSession.fulfilled, (state, action) => {
      state.currentSession = action.payload.session;
      state.currentQuestion = action.payload.firstQuestion;
      state.chatHistory = [
        {
          type: "question",
          content: action.payload.firstQuestion.questionText,
          ...action.payload.firstQuestion,
        },
      ];
      state.status = "awaiting-answer";
    })
    .addCase(startSession.rejected, (state, action) => {
      state.status = "idle";
      state.error = action.error.message;
    })
    .addCase(submitAnswer.pending, (state, action) => {
      state.status = "evaluating";
      state.chatHistory.push({
        type: "answer",
        content: action.meta.arg.answerText,
        answerMethod: action.meta.arg.answerMethod,
        timestamp: new Date().toISOString(),
      });
    })
    .addCase(submitAnswer.fulfilled, (state, action) => {
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
    })
    .addCase(submitAnswer.rejected, (state, action) => {
      state.status = "awaiting-answer";
      state.error = action.error.message;
    })
    .addCase(completeSession.pending, (state) => {
      state.status = "evaluating";
    })
    .addCase(completeSession.fulfilled, (state, action) => {
      state.currentSession = action.payload.session;
      state.currentSession.summary = action.payload.summary;
      state.status = "complete";
    })
    .addCase(completeSession.rejected, (state, action) => {
      state.status = "complete";
      state.error = action.error.message;
    })
    .addCase(rescoreAnswer.fulfilled, (state, action) => {
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
    })
    .addCase(rescoreAnswer.rejected, (state, action) => {
      state.error = action.error.message;
    });
});

export default sessionReducer;
