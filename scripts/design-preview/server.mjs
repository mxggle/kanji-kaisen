// Local preview of the round-6 design boards (docs/design/boards), no network
// beyond Google Fonts. Usage: node scripts/design-preview/server.mjs [port]
// Then open http://localhost:3300. Add ?skin=ink to a board to start in 墨.
//
// The boards reference uploaded canvas assets as /_blob/<id>; BLOBS maps each
// one to its file in this repo. The stylesheet is docs/design/one-atlas.css,
// which carries the plan's 45% 濃 fill in 夜 (the canvas copy uses 60%).

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const BOARDS = join(ROOT, "docs/design/boards");
const PORT = Number(process.argv[2] || process.env.PORT || 3300);

const BLOBS = {
    f1526c183b6c7c01b13b950d2b0b0c4c: "docs/design/one-atlas.css",
    "580dbc248edf01a25f6e29c739a74228": "public/ancient/06728-oracle.png",
    "51577df80dfc249bf2ba925674850e03": "public/ancient/06728-bronze.png",
    "04c4dd6180e6621ecd0fee79d901b01d": "public/ancient/06728-seal.png",
    "28d19b24c7e2598c6f58614d48958094": "public/ancient/04f11-oracle.svg",
    "84468b297eeb96a326d7cf70ebeebdcb": "public/ancient/04f11-bronze.svg",
    "1c1e616ad23863c6b6eae00ed6ff814e": "public/ancient/04f11-seal.svg",
    ce067a239e944fabd8b29ac759c55d3d: "public/images/categories/nature-elements.png",
    "2f5312f053f1417e7a003470bcf58887": "public/images/categories/human-body-people.png",
    f176bc2faa86f13e0d917e16f60d31ab: "public/images/categories/action-movement.png",
    d2004876bee2a4490a8a69edb3e1a562: "public/images/categories/structures-home.png",
    "2992cf17f59fd24ef46969673e2da4d2": "public/images/categories/animals-wildlife.png",
    "39fcbdec1ba6765ba14e38a2c24eae7f": "public/images/categories/tools-weapons.png",
    "51694cd8a7b5eddfc15347dc09beb94a": "public/images/categories/communication-thought.png",
    "529d8c91d0306bc7d342be28725095f2": "public/images/categories/textiles-plants-food.png",
    "22e9b772ab262ed1bb3983cd55ce0590": "public/images/categories/states-attributes.png",
    a36a2e5ee3525c845ddef0e823a95249: "public/images/categories/time-sequence.png",
};

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
};

const BOARD_NAME = /^A-[A-Za-z-]+\.dc\.html$/;

function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

async function indexPage() {
    const { boards, notes } = JSON.parse(await readFile(join(BOARDS, "boards.json"), "utf8"));
    const rows = Object.values(notes).sort((a, b) => a.y - b.y);
    const entries = Object.entries(boards).sort(([, a], [, b]) => a.y - b.y || a.x - b.x);
    const sections = rows.map((row, i) => {
        const next = rows[i + 1]?.y ?? Infinity;
        const items = entries
            .filter(([, b]) => b.y > row.y && b.y < next)
            .map(([file, b]) => {
                const href = `/board/${file}`;
                const kind = b.w < 600 ? "phone" : b.expand === "fill" ? "page" : "spec";
                return `<li><a href="${href}">${escapeHtml(b.title || file)}</a><span>${kind}</span><a class="alt" href="${href}?skin=ink">墨</a></li>`;
            })
            .join("");
        return `<section><h2>${escapeHtml(row.text)}</h2><ul>${items}</ul></section>`;
    });
    return `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Round 6 · local preview</title>
<style>
body{margin:0;background:#06070A;color:#EDEAE2;font:15px/1.6 system-ui,sans-serif}
main{max-width:880px;margin:0 auto;padding:48px 16px}
h1{font:600 30px Georgia,serif;margin:0 0 6px}
p{color:#B4AFA4;margin:0 0 32px}
h2{font-size:14px;color:#8C877D;font-weight:600;margin:32px 0 10px}
ul{list-style:none;margin:0;padding:0;border-top:1px solid rgba(237,234,226,.12)}
li{display:flex;gap:14px;align-items:center;padding:12px 4px;border-bottom:1px solid rgba(237,234,226,.12)}
li a{color:#EDEAE2;text-decoration:none}
li a:first-child{flex:1}
li a:hover{text-decoration:underline}
li span{font-size:12px;color:#8C877D}
.alt{width:32px;height:28px;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(237,234,226,.28);border-radius:14px}
</style></head><body><main>
<h1>Round 6 · One atlas</h1>
<p>本地预览：设计画板（不是 App）。每块画板右上角的 夜/墨 可切换皮肤，右边的“墨”链接直接以墨皮肤打开。当前 App 在 <a style="color:#EDEAE2" href="http://localhost:3200">localhost:3200</a>。</p>
${sections.join("")}
</main></body></html>`;
}

function boardPage() {
    // Phone boards (390 wide) get a centred frame; pages fill the window.
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
#root:has(> .kk[style*="width:390px"]){width:390px;margin:32px auto;border-radius:28px;overflow:hidden;outline:1px solid rgba(237,234,226,.2)}
#back{position:fixed;left:12px;bottom:12px;z-index:50;padding:6px 12px;border-radius:14px;background:rgba(0,0,0,.6);color:#EDEAE2;font:12px system-ui,sans-serif;text-decoration:none}
</style></head><body><div id="root"></div><a id="back" href="/">← All boards</a><script src="/runtime.js"></script></body></html>`;
}

async function send(res, status, body, type) {
    res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
    res.end(body);
}

const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const path = decodeURIComponent(url.pathname);
    try {
        if (path === "/") return send(res, 200, await indexPage(), TYPES[".html"]);
        if (path === "/runtime.js") return send(res, 200, await readFile(join(ROOT, "scripts/design-preview/runtime.js")), TYPES[".js"]);
        if (path.startsWith("/board/") && BOARD_NAME.test(path.slice(7))) return send(res, 200, boardPage(), TYPES[".html"]);
        if (path.startsWith("/boards/") && BOARD_NAME.test(path.slice(8))) {
            return send(res, 200, await readFile(join(BOARDS, path.slice(8))), TYPES[".html"]);
        }
        if (path.startsWith("/_blob/") && BLOBS[path.slice(7)]) {
            const file = BLOBS[path.slice(7)];
            return send(res, 200, await readFile(join(ROOT, file)), TYPES[extname(file)] || "application/octet-stream");
        }
        if (path === "/favicon.ico") return send(res, 204, "", "image/x-icon");
        return send(res, 404, "Not found", "text/plain; charset=utf-8");
    } catch (err) {
        return send(res, 500, String(err), "text/plain; charset=utf-8");
    }
});

server.listen(PORT, () => console.log(`Design preview on http://localhost:${PORT}`));
