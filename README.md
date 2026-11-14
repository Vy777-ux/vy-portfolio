# Nyx.aex — portfolio

A responsive, dependency-free portfolio with a private visual editor. The public page works as a static site and can be hosted free on GitHub Pages.

## Open and edit

Open `index.html` in a modern browser. Select the small ✳ button at the bottom right to open **Site editor**. The editor is not part of the visitor-facing page content. Changes preview immediately.

- **Content:** update headings, descriptions, social links, and project cards. Commissions and contact share one section, with Instagram, Discord, X, and YouTube as the primary contact links. Select **Edit any text directly on the page** to change any visible portfolio wording, including navigation and section labels. Click **Terminer et enregistrer** when done; text edits are saved in this browser and included in the site export.
- **Images & projects:** add a background, avatar, and project images from your device.
- **Fonts:** choose a display style or import a local WOFF2, WOFF, TTF, or OTF font.
- **Appearance:** adjust palette, all-text color and font, glass blur and opacity, content width, and section spacing.
- **Motion:** choose entrance and hover styles, timing, easing, and subtle parallax.
- **Save changes:** stores the current settings in this browser. This is local to this device and browser.
- **Download site for GitHub Pages:** creates `nyxaex-portfolio.zip` directly from the current editor state. No folder selection is needed. The archive includes the page, styles, scripts, saved text, settings, imported images, project thumbnails, videos links, and custom fonts.

Imported images are limited to 8 MB each. If browser storage runs out, export a site package to keep your work. Use **Download settings backup** to save or **Restore settings backup** to bring back settings on another browser. A settings backup does not include the original media files; use the site ZIP for a portable copy.

If a project has a YouTube URL in **Project link** and no custom thumbnail, its YouTube thumbnail is loaded automatically on the card. Clicking the card opens the video in a new tab. You can override the generated thumbnail with **Project image** or a public, direct image URL in **Or paste a direct image link**.

## Publish for free with GitHub Pages

For direct publishing from the editor, complete the one-time secure Worker setup in [PUBLISHING.md](PUBLISHING.md). The GitHub credential stays in Cloudflare; the browser receives only a separate publisher password. The editor asks for confirmation every time it commits an update.

1. Select **Download complete site ZIP** in the editor and extract `nyxaex-portfolio.zip` on your computer. It contains the latest saved editor state and its imported media.
2. Sign in to GitHub and create a **public repository** for the site.
3. Upload the extracted files and folders to the repository root. Confirm `index.html` is at the root, then commit the upload.
4. In the repository, open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, choose `main` and `/(root)`, then save.
5. GitHub will show the published address in the Pages section when deployment finishes.

To update manually, edit your site, export again, and upload the extracted files to the same repository. The ZIP is generated from the settings and media saved in this browser.

## Notes

- No paid service, build step, package manager, or framework is required.
- Font selection uses Google Fonts while online; custom imported fonts travel with the exported site.
- Project entries are examples. The contact area uses Instagram, Discord, X, and YouTube; add your own profile URLs in the editor when you are ready. No account names or social links are assumed.
- The ✳ editor button is intentionally subtle for convenience; remove the button from `index.html` if you want it absent from the published page. The editor panel is not shown unless that button is activated.
