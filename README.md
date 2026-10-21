# Nido del Bosque

A personal architectural design studio for a contemporary forest cabin in Santa Elena, Medellín, Colombia. This starter turns the project brief into an interactive concept that can be explored before professional design and construction review.

Built with React, TypeScript, Vite, Tailwind CSS, React Three Fiber, Drei and Three.js. It runs entirely in the browser, without paid services or API keys.

Use a current browser with WebGL 2 for the interactive model. A concept illustration appears when 3D rendering is unavailable; the controls, floor plan and budget remain usable.

## Run on your computer

Install [Node.js](https://nodejs.org/) 24, then open a terminal in this project folder and run:

```sh
npm ci
npm run dev
```

Vite prints the local address to open in your browser. Keep the terminal running while using the studio. Press `Ctrl+C` to stop it. If you use nvm, `nvm use` selects the version in `.nvmrc`.

## Public preview on GitHub Pages

The application source is on the `main` branch of `skydiazsd-gif/nido-del-bosque` on GitHub. To publish a public preview from a clean, committed checkout, run:

```sh
npm run deploy:pages
```

This builds the static application with the `/nido-del-bosque/` base path and publishes the generated files to the `gh-pages` branch using Git. It leaves the source checkout and its current branch unchanged. Your Git access must allow pushing to this repository; no application API key is needed.

For the first publication, open the repository on GitHub and select **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, select **gh-pages** and **/(root)**, then click **Save**. GitHub builds and deploys the site. Use the preview link shown by GitHub after that deployment succeeds; publishing the branch alone does not establish that the site is live.

The preview site is public. Images uploaded through the inspiration gallery remain in that browser's local storage and are not published to GitHub Pages.

The chat Web Preview panel is unavailable during cloud environment onboarding. For local development, use `npm run dev` and the terminal instructions above.

## Explore the starter

- **Design studio:** rotate and zoom around a procedural elevated cabin; choose a camera view; adjust cabin dimensions, elevation, roof pitch and terrace dimensions; try four exterior finish palettes.
- **Preliminary floor plan:** view an indicative layout that scales with the cabin and terrace. A live area summary counts the gross enclosed footprint plus terrace against the owner-reported 60 m² allowance.
- **Budget:** edit 14 cost categories in Colombian pesos and see the total, remaining allowance, allocation percentage and cost per gross constructed square metre against COP 80,000,000.
- **Inspiration:** upload reference images, categorise them, add notes and remove them.

The starting design is **Contemporary Elevated Cabin — V1**: 9 m × 6 m enclosed, with a 3 m × 2 m terrace. That is **54 m² gross enclosed + 6 m² terrace = 60 m²**.

Settings, budget entries and inspiration images are saved in this browser's local storage. They do not sync across devices or browsers. Clearing browser data removes them; storage limits may prevent saving large image collections. Named design versions, budget scenario comparison and file export are future work.

## What the numbers mean

This application is a concept tool, not a measured survey, construction drawing, engineering model or permission assessment. The floor plan uses an illustrative 150 mm wall thickness and an approximate deduction for internal partitions to distinguish estimated net area from gross construction area. These are modelling assumptions, not specified construction assemblies.

The 60 m² allowance is owner-reported. The municipality must confirm how terraces, stairs, parking, elevated floors and any accessible roof are counted. A rooftop terrace is excluded from this baseline and remains unapproved.

The initial COP 80M budget is a **reverse allocation of a fixed ceiling**, not supplier quotations or evidence that the full scheme is affordable. The individual starter categories are editable placeholders. They are not a certified estimate or an exact itemisation of the brief's broader budget groups. Structural feasibility, ground conditions, services and permits require professional review and itemised local quotations.

See [the development brief and roadmap](docs/DEVELOPMENT_BRIEF.md) for the project basis and outstanding decisions.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server on port 5173 |
| `npm run typecheck` | Check TypeScript |
| `npm test` | Run unit tests for quantities and saved state |
| `npm run test:watch` | Run unit tests while editing |
| `npm run test:e2e` | Run Chromium browser checks |
| `npm run build` | Check TypeScript and build production files into `dist/` |
| `npm run preview` | Serve the production build locally on port 4173 |

For browser tests on your own computer, install Chromium once:

```sh
npx playwright install chromium
npm run test:e2e
```

In the cloud environment, use its installed Chromium instead:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

If the cloud machine's home directory is read-only, install dependencies with its writable npm cache:

```sh
npm ci --cache /workspace/.cache/npm
```

Cloud tasks already have an isolated checkout. Use the existing `/workspace/nido-del-bosque` repository; do not create a Git worktree unless explicitly requested. Dependency files can persist in the environment snapshot, but the development server must be started again for a new task.

## Project structure

```text
docs/                  Project basis and next development steps
public/                Local static assets
src/
  components/          Cabin scene, floor plan, budget and inspiration views
  lib/                 Default state, area calculations, persistence and unit tests
  App.tsx              Studio interface and shared state
  main.tsx             React entry point
  styles.css           Tailwind entry and interface styles
  types.ts             Shared domain types
tests/                 Browser interaction checks
```

The starter has no backend, authentication, analytics, external image dependency or remote model download. Uploaded reference images stay in browser storage. Keep sensitive material out of any future public deployment unless its handling has been reviewed.
