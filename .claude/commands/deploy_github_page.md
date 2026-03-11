Deploy this project to GitHub Pages and return the live URL.

## Steps

1. **Check prerequisites** — run these checks in parallel:
   - `gh --version` to verify GitHub CLI is installed. If missing, tell the user to install it from https://cli.github.com and run `gh auth login`.
   - `gh auth status` to verify the user is authenticated. If not, prompt them to run `gh auth login`.
   - `git remote -v` to check if a remote origin exists.

2. **Detect the repo name** — run `gh repo view --json name,owner,url` to get the current GitHub repo info. If no remote exists yet:
   - Run `gh repo create <project-folder-name> --public --source=. --push` to create and link a new GitHub repo.
   - After creation, re-run `gh repo view --json name,owner,url` to get the repo details.

3. **Build with the correct base path** — GitHub Pages serves project sites under `https://<owner>.github.io/<repo>/`, so Vite must know the sub-path:
   ```
   npx vite build --base=/<REPO_NAME>/
   ```
   Output goes to `./build/`. Fix any build errors before proceeding.

4. **Install gh-pages if needed** — check if `gh-pages` is available:
   ```
   npx gh-pages --version
   ```
   If it fails, install it temporarily with `npm install --save-dev gh-pages`.

5. **Deploy the build folder to the `gh-pages` branch**:
   ```
   npx gh-pages -d build
   ```
   This pushes the contents of `./build/` to the `gh-pages` branch on the remote.

6. **Enable GitHub Pages** (if not already enabled) — use the GitHub CLI to set the Pages source to the `gh-pages` branch:
   ```
   gh api repos/{owner}/{repo}/pages \
     --method POST \
     -f source[branch]=gh-pages \
     -f source[path]=/ 2>/dev/null || \
   gh api repos/{owner}/{repo}/pages \
     --method PUT \
     -f source[branch]=gh-pages \
     -f source[path]=/
   ```

7. **Report the URL** — the live URL follows this pattern:
   ```
   https://<owner>.github.io/<repo>/
   ```
   Display it clearly to the user. Note that GitHub Pages may take 1–2 minutes to go live after the first deploy.

## Notes
- This is a Vite + React 18 SPA. Build output is in `./build/`. The `--base` flag is critical — without it, assets will 404 on GitHub Pages.
- The backend Express server (port 4000) is NOT deployed — only the frontend SPA. Auth/leaderboard features won't work.
- If the repo is private, GitHub Pages requires a paid plan. Recommend making the repo public.
- Subsequent deploys: just re-run `/deploy_github_page` — it will rebuild and push to the same `gh-pages` branch.
