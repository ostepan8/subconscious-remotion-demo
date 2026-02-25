# Subconscious Video Creator

An AI-powered video creator built with **Next.js**, **Remotion**, **Convex**, **Subconscious SDK**, and **ElevenLabs**. A devrel demo for [Subconscious](https://subconscious.dev).

Users describe their product, pick a visual theme, and an AI agent builds a multi-scene promotional video with animations, scripts, and voiceover — all updating in real-time.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Video**: Remotion (`@remotion/player`) for in-browser preview
- **Backend/Auth/Realtime**: Convex + @convex-dev/auth
- **AI Agent**: Subconscious SDK with function tools
- **Voiceover**: ElevenLabs TTS
- **Styling**: Tailwind CSS v4

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This starts the Convex dev server and auto-generates `.env.local` with your Convex URLs.

### 3. Generate JWT keys for Convex Auth

```bash
node -e "
const { generateKeyPairSync } = require('crypto');
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const jwk = require('crypto').createPublicKey(publicKey).export({ format: 'jwk' });
jwk.use = 'sig';
jwk.alg = 'RS256';
console.log('PRIVATE KEY:');
console.log(privateKey);
console.log('JWKS:');
console.log(JSON.stringify({ keys: [jwk] }));
"
```

Set the environment variables in Convex:

```bash
npx convex env set JWT_PRIVATE_KEY -- "-----BEGIN PRIVATE KEY-----
...paste key here...
-----END PRIVATE KEY-----"

npx convex env set JWKS '{"keys":[...]}'
npx convex env set SITE_URL http://localhost:3000
```

### 4. Add API keys to `.env.local`

```env
SUBCONSCIOUS_API_KEY=your-key
ELEVENLABS_API_KEY=your-key
TOOL_ENDPOINT_SECRET=any-random-string
SAVE_MESSAGE_SECRET=any-random-string
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
User → Landing Page → Sign Up/In → Dashboard → Create Video
                                                    ↓
                                            Pick Theme + Describe Product
                                                    ↓
                                         AI Agent (Subconscious) generates scenes
                                                    ↓
                                         Convex mutations → Real-time UI updates
                                                    ↓
                                         Remotion Player renders live preview
                                                    ↓
                                         ElevenLabs generates voiceover audio
```

### Key Components

- **Convex Backend**: Real-time database with projects, scenes, voiceovers, chat messages
- **HTTP Tool Endpoints**: 8 function tools the AI agent calls to manipulate video scenes
- **SSE Streaming**: `/api/chat/stream` streams Subconscious agent responses with thought extraction
- **Remotion Player**: Client-side video preview with 7 scene types and 5 themes
- **ElevenLabs**: `/api/voiceover/generate` converts scripts to audio stored in Convex

### Themes

| Theme | Style |
|-------|-------|
| Tech Startup | Dark gradients, neon accents |
| SaaS Product | Clean white, blue accents |
| Portfolio | Minimal, typography-focused |
| Agency | Creative, bold colors |
| E-commerce | Warm, product-focused |

### Scene Types

| Type | Content |
|------|---------|
| Hero | Headline, subtext, CTA button |
| Features | Headline + 3 feature cards |
| How It Works | Step-by-step with numbered circles |
| Testimonial | Quote + author |
| Pricing | Price, description, feature list |
| CTA | Bold headline + action button |
| Custom | Free-form text + bullets |

## Deployment

Deploy to Vercel:

```bash
npx convex deploy
vercel deploy
```

Set all environment variables in the Vercel dashboard.
