# Deployment Instructions

## Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variable:
   - Key: `GEMINI_API_KEY`
   - Value: Your Gemini API key
5. Deploy

## Environment Variables Required

- `GEMINI_API_KEY` - Your Google Gemini API key

The deployment will automatically:
- Build using `npm run build`
- Serve from the `dist` directory
- Handle client-side routing
