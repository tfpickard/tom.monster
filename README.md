# Tom Monster - Repository Street Narrative

Tom Monster is an experimental personal site that turns a GitHub account into a
procedurally generated streetscape. The project blends an asynchronous FastAPI
backend with a Next.js frontend and uses Three.js to render a stylised "street
view" of repositories and commits.

## Features

- Authenticates with GitHub using a personal access token.
- Filters out forked repositories and periodically samples a random repository.
- Deterministic Markov-inspired traversal to decide the next repository stop.
- Background jobs refresh repository data, precompute scenes, and stage the next
  set of OpenAI-generated micro stories about recent commits.
- Procedural scene generator converts repository metadata into buildings, roads,
  and lighting cues for the frontend Three.js visualisation.
- Next.js frontend polls the API, animates the city scene, and renders surreal
  commit narratives alongside repository metadata.

## Getting Started

### Requirements

- Python 3.11+
- Node.js 18+
- GitHub personal access token with `repo` scope for private repositories (or
  `public_repo` for public data only).
- OpenAI API key with access to the specified model (defaults to `gpt-4o-mini`).

### Environment configuration

1. Copy `.env.example` to `.env` and update the values.

   ```bash
   cp .env.example .env
   ```

2. Ensure `GITHUB_TOKEN` is set to a personal access token. The backend uses
   this token to list repositories and read recent commits.
3. Provide `OPENAI_API_KEY` with a key that can call the chosen OpenAI model.
   Optionally override `OPENAI_MODEL` to experiment with other deployments.
4. Update `NEXT_PUBLIC_BACKEND_URL` if the backend runs on a different host or
   port. This value is consumed by the Next.js frontend.

### Backend

1. Create a virtual environment and install dependencies:

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install fastapi uvicorn[standard] httpx apscheduler openai python-dotenv
   ```

2. Run the API server:

   ```bash
   BACKEND_URL=http://localhost:8000 uvicorn backend.app:app --reload
   ```

   The server automatically:

   - Fetches repositories every 15 minutes.
   - Advances to the next repository every 5 minutes.
   - Provides `/current` and `/next` endpoints exposing metadata, commit
     messages, surreal statements, and scene descriptors.

### Frontend

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) to watch the evolving
   repository street view. The frontend polls the backend every 15 seconds to
   fetch the latest snapshots.

## Project Structure

```
backend/
  app.py        # FastAPI application with background scheduler
  markov.py     # Deterministic traversal logic for repository selection
  scene.py      # Procedural scene generation utilities
  story.py      # OpenAI-backed surreal narrative composer
frontend/
  components/   # React components including the Three.js street scene
  pages/        # Next.js pages entrypoint
  styles/       # Module styles for the UI
```

## Extending the Experiment

- Adjust the scheduling cadence by editing the job intervals in
  `backend/app.py`.
- Expand `backend/scene.py` with additional geometry or lighting recipes to
  visualise more repository metadata such as stars and issues.
- Tune the surreal narrative by adjusting `backend/story.py` prompts or swapping
  in a different OpenAI model via the `OPENAI_MODEL` environment variable.

## License

MIT
