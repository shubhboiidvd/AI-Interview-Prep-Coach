import { useEffect, useRef, useState } from "react";
import { Mic, Send, Volume2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  completeSession,
  rescoreAnswer,
  submitAnswer,
} from "../features/session/sessionSlice";
import {
  setTranscript,
  startListening,
  stopListening,
} from "../features/voice/voiceSlice";

function Feedback({ message, onRescore }) {
  const content = message.content || {};
  return (
    <div className="max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Coach feedback
        </span>
        <strong className="text-2xl text-emerald-800">
          {message.score}/10
        </strong>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <p>
          <b>Clarity</b>
          <br />
          {content.clarity}
        </p>
        <p>
          <b>Depth</b>
          <br />
          {content.depth}
        </p>
        <p>
          <b>Structure</b>
          <br />
          {content.structure}
        </p>
      </div>
      <div className="mt-4 border-t border-emerald-200 pt-4 text-sm">
        <b>Model answer direction</b>
        <p className="mt-1">{content.modelAnswer}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-emerald-200 pt-4">
        <span className="text-xs text-emerald-700">
          Try another coach perspective
        </span>
        <select
          aria-label="Re-score with another model"
          onChange={(event) =>
            event.target.value && onRescore(event.target.value)
          }
          defaultValue=""
          className="rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs"
        >
          <option value="" disabled>
            Re-score
          </option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Claude</option>
          <option value="gemini">Gemini</option>
        </select>
      </div>
    </div>
  );
}
export default function InterviewPage() {
  const { currentSession, currentQuestion, chatHistory, status, error } =
    useSelector((state) => state.session);
  const voice = useSelector((state) => state.voice);
  const [answer, setAnswer] = useState("");
  const recognition = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    if (!currentSession) navigate("/setup");
  }, [currentSession, navigate]);
  useEffect(() => {
    if (voice.transcript) setAnswer(voice.transcript);
  }, [voice.transcript]);
  const finishSession = async () => {
    const completed = await dispatch(completeSession());
    if (!completed.error) navigate("/summary");
  };
  const toggleMic = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (voice.isListening) {
      recognition.current?.stop();
      dispatch(stopListening());
      return;
    }
    const instance = new SpeechRecognition();
    instance.continuous = true;
    instance.interimResults = true;
    instance.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      dispatch(setTranscript(transcript));
    };
    instance.onend = () => dispatch(stopListening());
    recognition.current = instance;
    dispatch(startListening());
    instance.start();
  };
  const send = async (event) => {
    event.preventDefault();
    if (!answer.trim() || status === "evaluating") return;
    const result = await dispatch(
      submitAnswer({
        answerText: answer,
        answerMethod: voice.isListening ? "voice" : "text",
      }),
    );
    setAnswer("");
    dispatch(setTranscript(""));
    if (result.payload?.sessionComplete) {
      await finishSession();
    }
  };
  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="eyebrow">
            <Volume2 size={14} /> Live coaching
          </span>
          <h1 className="mt-3 text-2xl font-semibold">
            {currentSession?.role} · {currentSession?.difficulty}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
            {chatHistory.filter((item) => item.type === "question").length} /{" "}
            {currentSession?.questionCount} questions
          </span>
          <button
            type="button"
            onClick={finishSession}
            disabled={status === "evaluating"}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 disabled:opacity-40"
          >
            Save &amp; exit
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {chatHistory.map((message, index) =>
          message.type === "feedback" ?
            <Feedback
              key={index}
              message={message}
              onRescore={(provider) =>
                dispatch(
                  rescoreAnswer({ questionId: message.questionId, provider }),
                )
              }
            />
          : <div
              key={index}
              className={`flex ${message.type === "answer" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl rounded-2xl px-5 py-4 text-sm leading-6 ${message.type === "answer" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white"}`}
              >
                {message.content}
              </div>
            </div>,
        )}
        {status === "evaluating" && (
          <div className="text-sm text-slate-400">
            Your coach is reviewing that answer...
          </div>
        )}
      </div>
      <form
        onSubmit={send}
        className="sticky bottom-4 mt-8 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg"
      >
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows="3"
          className="w-full resize-none border-0 bg-transparent p-2 text-sm outline-none"
          placeholder={
            currentQuestion ?
              "Write your answer..."
            : "Finishing your session..."
          }
        />
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={toggleMic}
            disabled={!voice.isSupported}
            title={
              voice.isSupported ? "Use voice input" : (
                "Voice input is not supported in this browser"
              )
            }
            className={`rounded-xl p-2 ${voice.isListening ? "animate-pulse bg-rose-100 text-rose-600" : "text-slate-500 hover:bg-slate-100"}`}
          >
            <Mic size={18} />
          </button>
          <button
            disabled={!answer.trim() || status === "evaluating"}
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Send answer
            <Send size={15} />
          </button>
        </div>
      </form>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
    </section>
  );
}
