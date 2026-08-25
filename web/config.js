// Living Galaxy — where the living galaxy actually is.
//
// Two ways to deploy the web suite, one switch:
//
//   * Everything from the laptop (default): the same host that served this file runs
//     the galaxy. Leave `host` empty — every page and the game boot screen use their
//     own origin.
//   * Static site on a CDN (GitHub → Cloudflare Pages), galaxy behind the tunnel:
//     set `host` to the tunnel hostname, e.g. 'api.living-galaxy.com'. Pages then
//     send API calls there (with credentials), and the boot screen prefolds
//     wss://that-host. The server must be started with
//     --web-origin=https://your-pages-domain so it answers cross-origin.
//
// Plain script on purpose (not a module): every page and index.html load it first,
// and it must work from a CDN, a laptop, and file:// alike.
window.GALAXY = {
  host: ''            // '' = same origin · or e.g. 'api.living-galaxy.com'
};
