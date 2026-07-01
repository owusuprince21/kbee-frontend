Route-specific OpenGraph card screenshots live here.

To refresh them from the actual interface:

1. Start the frontend locally with `npm run dev` or deploy a preview URL.
2. Install the browser once with `npm install -D playwright && npm run og:install`.
3. Run `OG_CAPTURE_BASE_URL=http://localhost:3000 npm run og:capture`.

The SEO helper in `lib/seo.ts` points metadata cards to these files.
