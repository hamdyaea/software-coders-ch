# Cloudflare Pages

Developer: Hamdy Abou El Anein.

Branch: publish/cloudflare-pages-20261103. Framework: None. Root: repository root. Build command: `python3 scripts/build-pages.py`. Output: `dist/cloudflare-pages`.

Only public site files are published. Logs, PHP files and private configuration are excluded. The old Apache .htaccess is not interpreted by Pages: private files must remain outside the deployment output. A real 404 prevents Pages SPA fallback from masking missing files.

The contact form still uses Formspree; Stripe and its fees remain separate. The existing chatbot uses PythonAnywhere and needs its backend/CORS allowance to continue. No form submission or payment was performed during migration testing. The Linux Incident Arena is implemented in arena/. It boots a real, isolated Alpine guest entirely in the visitor browser. The Pi is not used. See arena/SOURCES.md for rebuilds, licensing, privacy and tests. Every runtime file is smaller than 16 MiB.

Preview on pages.dev before attaching software-coders.ch and www.software-coders.ch. Preserve mail DNS and other subdomains.
