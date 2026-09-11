import { createAction } from "@reduxjs/toolkit";

export const startListening = createAction("voice/startListening");
export const stopListening = createAction("voice/stopListening");
export const setTranscript = createAction("voice/setTranscript");
export const resetTranscript = createAction("voice/resetTranscript");
