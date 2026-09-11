# AI Interview Prep Coach

A MERN monorepo for an AI-powered interview practice coach.

## Included features

- JWT authentication with bcrypt password hashing.
- Adaptive interview sessions with technical, behavioral, and mixed rounds.
- Provider-agnostic OpenAI, Anthropic, and Gemini adapters with structured JSON responses.
- Local AI fallback responses when provider keys are not configured, useful for development.
- Redux-driven live Q&A chat with Web Speech API voice input.
- Session summaries, score trends, role filters, and dashboard statistics.
- Multi-model re-scoring for completed answers.
- Rate limiting and express-validator validation on AI-facing endpoints.

## Setup

1. Install Node.js 18+ and MongoDB.
2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and `JWT_SECRET`. Add one or more AI provider keys for live provider calls.
3. Install dependencies from the repository root:

```bash
npm install
```

4. Start the client and server together:

```bash
npm run dev
```

The client runs at `http://localhost:5173` and the API at `http://localhost:5001` by default. Port 5001 avoids a macOS ControlCenter conflict on port 5000.

For a client-only API URL override, create `client/.env` with `VITE_API_URL=http://localhost:5001/api`.

## API surface

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/sessions`, `POST /api/sessions/:id/answer`, `POST /api/sessions/:id/complete`
- `GET /api/sessions`, `GET /api/sessions/:id`
- `POST /api/qa/:id/rescore`
- `GET /api/dashboard/stats`

## Redux architecture

The store lives at `client/src/app/store.js`, and `client/src/app/rootReducer.js` combines the feature reducers. Each feature keeps its Redux responsibilities in separate files:

```text
client/src/features/
	auth/
		actions.js       # synchronous actions and async thunks
		reducer.js       # auth state and action handling
		selectors.js     # reusable auth state selectors
	session/
		actions.js       # session actions and async thunks
		reducer.js       # live interview state transitions
		selectors.js     # reusable session selectors
	voice/
		actions.js       # speech input actions
		reducer.js       # voice state transitions
		selectors.js     # reusable voice selectors
```

Components dispatch actions from the feature `actions.js` files and read state through selectors from `selectors.js`. `client/src/app/apiSlice.js` owns the shared RTK Query cache and base query for dashboard data. Async thunks handle authentication, session creation, answer evaluation, completion, and re-scoring because each flow updates state across multiple request stages.
