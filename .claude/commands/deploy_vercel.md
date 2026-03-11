Deploy this project to Vercel and return the live URL.

## Steps

1. **Check Vercel CLI** — run `vercel --version` to see if it's installed. If it fails, install it globally with `npm install -g vercel`.

2. **Build the project** — run `npm run build` in the project root. The output goes to `./build/`. Fix any build errors before proceeding.

3. **Deploy to Vercel** — run `vercel --prod --yes` with the following settings:
   - Build output directory: `build`
   - No build command needed (we already built in step 2): pass `--build-env SKIP_BUILD=1` or deploy the `build` folder directly using `vercel build && vercel deploy --prebuilt --prod`
   - If not yet linked to a Vercel project, run `vercel link` first or use `vercel --prod --yes` and accept the prompts.

   Preferred command (deploys pre-built output):
   ```
   vercel build && vercel deploy --prebuilt --prod
   ```

4. **Report the URL** — extract the production URL from the Vercel CLI output (it looks like `https://<project>.vercel.app`) and display it clearly to the user so they can open it in a browser.

## Notes
- This is a Vite + React 18 + TypeScript SPA. Build output is in `./build/`.
- If `vercel login` is required, prompt the user to authenticate first.
- The backend Express server (port 4000) is NOT deployed by this command — only the frontend SPA.
