# Secure publishing for Vy_

The editor is a static GitHub Pages site, so it cannot hold a GitHub credential safely. The **Publish** button sends the prepared site files to a small Cloudflare Worker over HTTPS. The Worker checks the origin and a private publisher password, then creates one Git commit using a GitHub token stored only as a Cloudflare secret. GitHub Pages deploys that commit from `main` / root.

## One-time setup

You need a Cloudflare account, the existing GitHub Pages repository, and a GitHub fine-grained personal access token. No OAuth application is required.

1. In GitHub, create a fine-grained token restricted to the portfolio repository. Give it **Contents: Read and write** permission. Do not put this token in the website files.
2. In `publisher-worker/wrangler.toml`, replace `GITHUB_OWNER`, `GITHUB_REPO` and `PUBLISH_ORIGIN` with the repository owner, repository name, and the exact site origin shown under GitHub **Settings → Pages**. The origin has no trailing slash or path; for example, `https://account.github.io`.
3. Choose a unique password of at least 32 random characters in a password manager. It is separate from the GitHub token.
4. Install/use Wrangler and, from `publisher-worker`, run `npx wrangler login`, then set the two encrypted secrets and deploy:

   ```powershell
   npx wrangler secret put GITHUB_TOKEN
   npx wrangler secret put PUBLISH_PASSWORD
   npx wrangler deploy
   ```

   Paste the token and password when Wrangler prompts. The Worker also has a five-request-per-minute rate limit. If your Cloudflare account already uses rate-limit namespace `87654321`, change `namespace_id` to a different unused positive integer before deploy.

5. Copy the Worker URL, ending in `/publish`, into **Site editor → Publish → Secure publisher URL**. Enter the publisher password only when you publish. The editor keeps the URL in this browser; it does not save the password.
6. Before the new button can be used on the live site, manually upload and commit this updated portfolio project once to the existing repository. Keep GitHub Pages configured for that repository and branch (`main`, root). The Worker updates an existing `main` branch; it does not create a repository or install itself on the live site.

## Publishing changes

Open the portfolio on its HTTPS GitHub Pages address, make and save your edits, then open **✳ → Publish**. Enter the password and select **Publish changes to GitHub Pages**. Confirm the prompt. Text, free-form page text, project links and cards, uploaded images, colors, fonts, and motion settings are packaged into the commit. GitHub Pages may take a few minutes to show it.

The editor also remains device-local: **Save on this device** only affects the current browser. A later visitor will not see unpublished edits. The downloadable ZIP and settings backup remain available.

## Security boundaries

- The browser sends only the publisher password and site files to the configured HTTPS Worker. It never receives the GitHub token.
- The Worker accepts requests only from the configured Pages origin, restricts paths to the site and `images/` / `fonts/`, limits uploads, and checks a rate-limit binding.
- Use a strong unique publisher password and keep the repository-scoped GitHub token private. If either is exposed, replace it in Cloudflare immediately.
- This is a single-editor shared-password workflow. Anyone who knows that password can publish to the configured repository. For multi-user access, replace it with individual sign-in such as Cloudflare Access or GitHub OAuth.

## Troubleshooting

- **Origin not allowed:** `PUBLISH_ORIGIN` must match the exact scheme and hostname of the Pages site, without a path or trailing slash.
- **Incorrect publisher password:** set `PUBLISH_PASSWORD` again with `npx wrangler secret put PUBLISH_PASSWORD` and use that value in the editor.
- **GitHub 404 / branch not found:** verify the owner, repository, token repository access, and that the `main` branch already exists.
- **GitHub 403:** verify that the fine-grained token has repository Contents read/write permission and has been approved if the account requires approval.
- **Upload too large:** reduce the image size and retry. The Worker accepts up to 9 MB per file and 36 MB total media.
