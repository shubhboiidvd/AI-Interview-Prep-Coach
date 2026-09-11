import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isListening: false,
  transcript: "",
  isSupported:
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
  error: null,
};

const voiceSlice = createSlice({
  name: "voice",
  initialState,
  reducers: {
    startListening: (state) => {
      state.isListening = true;
      state.error = null;
    },
    stopListening: (state) => {
      state.isListening = false;
    },
    setTranscript: (state, action) => {
      state.transcript = action.payload;
    },
    resetTranscript: (state) => {
      state.transcript = "";
      state.error = null;
    },
  },
});

export const { startListening, stopListening, setTranscript, resetTranscript } =
  voiceSlice.actions;
export default voiceSlice.reducer;
