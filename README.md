# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Video Generation Feature

This project includes integration with Google's Veo 3.1 model for AI-powered video generation. The feature allows generating videos from text prompts or news articles.

### Usage

#### Service Layer
The video generation service is located in `src/services/video.ts` and provides two main functions:

1. `generateVideo(prompt: string): Promise<Buffer>` - Generate video from a text prompt
2. `generateVideoFromArticle(article: NewsArticle): Promise<Buffer>` - Generate video based on a news article

#### API Endpoint
A REST API endpoint is available at `/api/video` that accepts POST requests with either:
- `{ "prompt": "your video description here" }`
- `{ "article": { /* NewsArticle object */ } }`

The endpoint returns the generated video as an MP4 file download.

### Environment Setup

To use the video generation feature, you need to set up Google API credentials:

1. Obtain a Google AI API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add the API key to your environment variables:
   - For development: Add `VITE_GOOGLE_API_KEY=your_api_key_here` to your `.env` file
   - For production: Set `GOOGLE_API_KEY` in your server environment

### Dependencies

The feature requires the `@google/genai` package, which is already included in the project dependencies.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
