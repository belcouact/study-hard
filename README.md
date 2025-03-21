# Study Assistant

A web application that connects to an AI API for educational assistance.

## Project Structure

- `index.html` - Main webpage
- `styles.css` - CSS styles
- `script.js` - Frontend JavaScript
- `worker.js` - Cloudflare Worker for API proxy
- `wrangler.toml` - Cloudflare Worker configuration

## Deployment Instructions

### 1. Deploy the Cloudflare Worker

The Cloudflare Worker acts as a proxy between your frontend and the OpenAI API.

1. Install Wrangler CLI (if not already installed):
   ```
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```
   wrangler login
   ```

3. Configure the Worker:
   - Open `wrangler.toml` and update the `OPENAI_API_KEY` with your actual OpenAI API key
   - Update the `name` if desired

4. Update your Worker code:
   - Open `worker.js` and set your `OPENAI_API_KEY` 
   - Update `ALLOWED_ORIGINS` with your actual Cloudflare Pages URL once it's deployed

5. Deploy the Worker:
   ```
   wrangler deploy
   ```

6. Take note of your Worker URL (it will look like `https://study-assist-api.your-username.workers.dev`)

### 2. Deploy the Frontend to Cloudflare Pages

1. Create a new Cloudflare Pages project from your GitHub repository

2. Configure build settings:
   - Build command: Leave empty (or use `npm run build` if you add a build process later)
   - Build output directory: `.` (root directory)

3. Deploy the site

4. Update your frontend code:
   - Open `script.js` and update the `baseUrl` in `platformConfig.ark` to point to your Worker URL

5. Commit the changes and redeploy

## Local Development

For local development:

1. Clone the repository

2. Install Wrangler for local Worker development:
   ```
   npm install -g wrangler
   ```

3. Start the Worker locally:
   ```
   wrangler dev
   ```

4. You can serve the frontend files locally using any simple HTTP server, for example:
   ```
   npx http-server
   ```

5. Make sure `baseUrl` in `script.js` points to your local Worker URL (typically http://localhost:8787)

## Security Considerations

- The API key is currently hardcoded in the JavaScript. For a production application, consider using a more secure approach.
- The Cloudflare Worker validates the API key for demonstration purposes, but in a production environment, you should implement more robust authentication.