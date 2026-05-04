# ModuleMindDemo

Expo web app plus a Node upload API that turns PDF, DOCX, or TXT files into quiz questions.

## Get Started

1. Install dependencies.

   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

2. Configure environment variables.

   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```

   Set `server/.env` to your OpenAI API key. Set root `.env` to the public upload endpoint used by the web app.

3. Start the API.

   ```bash
   node server/index.js
   ```

4. Start the app.

   ```bash
   npm run web
   ```

## GitHub Pages

GitHub Pages can host the static Expo frontend, but it cannot host the Node/OpenAI upload API. Deploy `server/` to a backend host such as Vercel first, set `EXPO_PUBLIC_UPLOAD_URL` to that public HTTPS `/upload` URL, then build:

```bash
npm run build
```

Publish the generated `docs/` folder with GitHub Pages. The app includes `docs/.nojekyll` so Expo's `_expo` assets are served correctly.

## Quiz Flow

The upload screen sends the selected file and model to the API. The API returns `{ questions: [...] }`, and the module preview screen reads that AI-generated result from browser session storage so longer quizzes do not break web route URLs.
