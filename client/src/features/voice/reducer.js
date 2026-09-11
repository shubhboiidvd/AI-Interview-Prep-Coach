import { createReducer } from "@reduxjs/toolkit";
import {
  resetTranscript,
  setTranscript,
  startListening,
  stopListening,
} from "./actions";

const initialState = {
  isListening: false,
  transcript: "",
  isSupported:
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
  error: null,
};

const voiceReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(startListening, (state) => {
      state.isListening = true;
      state.error = null;
    })
    .addCase(stopListening, (state) => {
      state.isListening = false;
    })
    .addCase(setTranscript, (state, action) => {
      state.transcript = action.payload;
    })
    .addCase(resetTranscript, (state) => {
      state.transcript = "";
      state.error = null;
    });
});

export default voiceReducer;
