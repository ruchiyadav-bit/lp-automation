// ─── COOKIE BANNER TEMPLATES ────────────────────────────────────────────────

const DEFAULT_COOKIE_HEADLINE = "We Use Cookie";
const DEFAULT_COOKIE_BODY = `To improve your browsing experience and analyze site traffic, we use cookies. By clicking "Accept", you consent to our use of cookies. You can decline if you prefer limited functionality.`;

// Builds the overlay's background CSS — a solid color, or an image with a dark scrim at the given opacity.
function cookieOverlayBg({ bgType, bgColor, bgImage, bgOpacity = 0.6 }, fallbackColor) {
  if (bgType === "image" && bgImage) {
    return `linear-gradient(rgba(15,23,42,${bgOpacity}),rgba(15,23,42,${bgOpacity})), url('${bgImage}') center/cover no-repeat`;
  }
  return bgColor || fallbackColor;
}

// Injects Advanced-styling overrides (heading/subcontent/button typography + colors, box color,
// button width/spacing) into a generated template's HTML by appending high-specificity rules
// to its first <style> block.
function formatCSS(format) {
  return {
    textTransform: format === "uppercase" ? "uppercase" : "none",
    fontStyle: format === "italic" ? "italic" : "normal"
  };
}

export function applyAdvancedStyles(html, adv = {}) {
  if (!adv.enabled) return html;
  const {
    headingColor, subColor, boxColor,
    fontSize, fontWeight, format,                     // heading typography
    subFontSize, subFontWeight, subFormat,             // subheading/body typography
    buttonColor, buttonTextColor,
    btnFontSize, btnFontWeight, btnFormat,             // button typography
    buttonWidth, buttonPaddingX, buttonPaddingY        // button size/spacing
  } = adv;
  const h = formatCSS(format);
  const s = formatCSS(subFormat);
  const b = formatCSS(btnFormat);

  const btnWidthCSS = buttonWidth === "full"
    ? "width:100% !important;display:block !important;"
    : (buttonWidth ? `width:${buttonWidth}px !important;` : "");
  const btnPaddingCSS = (buttonPaddingX || buttonPaddingY)
    ? `padding:${buttonPaddingY || 13}px ${buttonPaddingX || 24}px !important;`
    : "";

  const rules = `
#modal,#modal>div{${boxColor ? `background:${boxColor} !important;` : ""}}
h1{${headingColor ? `color:${headingColor} !important;` : ""}${fontSize ? `font-size:${fontSize}px !important;` : ""}${fontWeight ? `font-weight:${fontWeight} !important;` : ""}text-transform:${h.textTransform} !important;font-style:${h.fontStyle} !important;}
p,.content p{${subColor ? `color:${subColor} !important;` : ""}${subFontSize ? `font-size:${subFontSize}px !important;` : ""}${subFontWeight ? `font-weight:${subFontWeight} !important;` : ""}text-transform:${s.textTransform} !important;font-style:${s.fontStyle} !important;}
.btn-accept,.btn-decline{${btnFontSize ? `font-size:${btnFontSize}px !important;` : ""}${btnFontWeight ? `font-weight:${btnFontWeight} !important;` : ""}text-transform:${b.textTransform} !important;font-style:${b.fontStyle} !important;${btnWidthCSS}${btnPaddingCSS}}
.btn-accept{${buttonColor ? `background:${buttonColor} !important;border-color:${buttonColor} !important;` : ""}${buttonTextColor ? `color:${buttonTextColor} !important;` : ""}}
`;
  return html.replace("</style>", rules + "</style>");
}

// ─── Simple field editing for already-saved pages ──────────────────────────
// Generic across all cookie templates because they all consistently use
// <h1> for the heading, the first <p> for body copy, and .btn-accept/.btn-decline classes.

function stripTags(s = "") { return s.replace(/<[^>]*>/g, "").trim(); }
function escapeHtml(s = "") { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

export function extractCookieFields(html = "") {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const p = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  const accept = html.match(/class="[^"]*\bbtn-accept\b[^"]*"[^>]*>([^<]*)<\/button>/);
  const decline = html.match(/class="[^"]*\bbtn-decline\b[^"]*"[^>]*>([^<]*)<\/button>/);
  const acceptUrl = html.match(/function accept\(\)\{[^}]*var u='([^']*)'/);
  const declineUrl = html.match(/function decline\(\)\{[^}]*var u='([^']*)'/);
  const closeUrl = html.match(/function closeModal\(\)\{[^}]*var u='([^']*)'/);
  return {
    headline: h1 ? stripTags(h1[1]) : "",
    bodyCopy: p ? stripTags(p[1]) : "",
    acceptText: accept ? accept[1].trim() : "",
    declineText: decline ? decline[1].trim() : "",
    acceptUrl: acceptUrl ? acceptUrl[1] : "",
    declineUrl: declineUrl ? declineUrl[1] : "",
    closeUrl: closeUrl ? closeUrl[1] : ""
  };
}

export function applyCookieFields(html = "", fields = {}) {
  let out = html;
  const { headline, bodyCopy, acceptText, declineText, acceptUrl, declineUrl, closeUrl } = fields;
  if (headline !== undefined) out = out.replace(/(<h1[^>]*>)([\s\S]*?)(<\/h1>)/, (m, a, b, c) => `${a}${escapeHtml(headline)}${c}`);
  if (bodyCopy !== undefined) out = out.replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/, (m, a, b, c) => `${a}${escapeHtml(bodyCopy)}${c}`);
  if (acceptText !== undefined) out = out.replace(/(class="[^"]*\bbtn-accept\b[^"]*"[^>]*>)([^<]*)(<\/button>)/, (m, a, b, c) => `${a}${escapeHtml(acceptText)}${c}`);
  if (declineText !== undefined) out = out.replace(/(class="[^"]*\bbtn-decline\b[^"]*"[^>]*>)([^<]*)(<\/button>)/, (m, a, b, c) => `${a}${escapeHtml(declineText)}${c}`);
  if (acceptUrl !== undefined) out = out.replace(/(function accept\(\)\{[^}]*var u=')([^']*)(')/, (m, a, b, c) => `${a}${acceptUrl}${c}`);
  if (declineUrl !== undefined) out = out.replace(/(function decline\(\)\{[^}]*var u=')([^']*)(')/, (m, a, b, c) => `${a}${declineUrl}${c}`);
  if (closeUrl !== undefined) out = out.replace(/(function closeModal\(\)\{[^}]*var u=')([^']*)(')/, (m, a, b, c) => `${a}${closeUrl}${c}`);
  return out;
}

// Hand-illustrated bitten cookie with chocolate chips — used by the classy template.
const COOKIE_SVG = `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M104 56c2 0 4 2 4 5 0 22-20 47-48 47-26 0-47-21-47-47 0-3 0-6 1-9 2 1 5 2 8 2 8 0 15-6 16-14 1 1 3 1 5 1 9 0 16-7 16-16 0-2 0-4-1-6 2 1 4 1 6 1 9 0 16-7 16-16 0-1 0-2 0-3 14 4 24 17 24 33Z" fill="#E8A855"/>
<path d="M104 56c2 0 4 2 4 5 0 22-20 47-48 47-26 0-47-21-47-47 0-3 0-6 1-9 2 1 5 2 8 2 8 0 15-6 16-14 1 1 3 1 5 1 9 0 16-7 16-16 0-2 0-4-1-6 2 1 4 1 6 1 9 0 16-7 16-16 0-1 0-2 0-3 14 4 24 17 24 33Z" stroke="#C97E33" stroke-width="2"/>
<circle cx="50" cy="50" r="6" fill="#7A4A1E"/>
<circle cx="72" cy="58" r="4.5" fill="#7A4A1E"/>
<circle cx="40" cy="72" r="5" fill="#7A4A1E"/>
<circle cx="62" cy="80" r="4" fill="#7A4A1E"/>
<circle cx="84" cy="76" r="4.5" fill="#7A4A1E"/>
<circle cx="30" cy="55" r="3.5" fill="#7A4A1E"/>
<circle cx="92" cy="48" r="2.5" fill="#F3C27D"/>
<circle cx="98" cy="40" r="3.5" fill="#F3C27D"/>
<circle cx="86" cy="34" r="2" fill="#F3C27D"/>
</svg>`;

export const COOKIE_TEMPLATES = [
  {
    id: "classic-illustrated",
    name: "Classic Illustrated",
    description: "Cream background, illustrated cookie, serif heading",
    icon: "fa-solid fa-cookie",
    preview: { bg: "#f5f0e8", accent: "#c97e33" },
    generate: (p) => {
      const { headline = DEFAULT_COOKIE_HEADLINE, bodyCopy = DEFAULT_COOKIE_BODY, domain = "",
              acceptText = "Accept", declineText = "Decline", acceptUrl = "", declineUrl = "", closeUrl = "" } = p;
      const overlayBg = cookieOverlayBg(p, "rgba(40,30,20,.45)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<title>${headline} – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
#overlay{position:fixed;inset:0;width:100vw;height:100vh;background:${overlayBg};backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}
#modal{position:relative;max-width:460px;width:100%;background:#f5f0e8;border-radius:20px;padding:44px 40px;text-align:center;box-shadow:0 30px 80px rgba(60,40,20,.35);overflow:hidden;animation:pop .35s cubic-bezier(.2,.9,.3,1.2)}
@keyframes pop{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
.sparkle{position:absolute;color:#d9c4a3;font-size:18px;opacity:.7}
.s1{top:18px;left:24px}.s2{top:40px;right:36px;font-size:12px}.s3{bottom:90px;left:18px;font-size:14px}.s4{bottom:24px;right:24px}
.close{position:absolute;top:16px;right:16px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.05);color:#8a6d4a;border:none;cursor:pointer;font-size:13px;transition:.15s;z-index:2}
.close:hover{background:rgba(0,0,0,.1);transform:rotate(90deg)}
.cb-icon{margin:0 auto 20px;filter:drop-shadow(0 10px 18px rgba(180,120,40,.3))}
h1{font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:800;color:#5c3a1e;margin-bottom:14px;letter-spacing:-.01em}
p{font-size:14px;color:#8a7259;line-height:1.75;margin-bottom:30px;max-width:360px;margin-left:auto;margin-right:auto}
.btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.btn{padding:13px 30px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;transition:.18s}
.btn-accept{background:#c97e33;color:#fff;border:none;box-shadow:0 10px 24px rgba(201,126,51,.4)}.btn-accept:hover{background:#b56b25;transform:translateY(-1px)}
.btn-decline{background:transparent;color:#8a6d4a;border:1.5px solid #d9c4a3}.btn-decline:hover{background:rgba(0,0,0,.04)}
@media(max-width:480px){#modal{padding:36px 26px;border-radius:16px}h1{font-size:23px}.btn{flex:1;padding:13px 16px}}
</style></head><body>
<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8">Your website content here</div>
<div id="overlay">
  <div id="modal">
    <span class="sparkle s1">✦</span><span class="sparkle s2">✦</span><span class="sparkle s3">✦</span><span class="sparkle s4">✦</span>
    <button class="close" onclick="closeModal()">✕</button>
    <div class="cb-icon">${COOKIE_SVG}</div>
    <h1>${headline}</h1>
    <p>${bodyCopy}</p>
    <div class="btns">
      <button class="btn btn-accept" onclick="accept()">${acceptText}</button>
      <button class="btn btn-decline" onclick="decline()">${declineText}</button>
    </div>
  </div>
</div>
<script>
function accept(){localStorage.setItem('cookie_consent','accepted');var u='${acceptUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function decline(){localStorage.setItem('cookie_consent','declined');var u='${declineUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function closeModal(){var u='${closeUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
</script>
</body></html>`;
    }
  },
  {
    id: "dark-modal",
    name: "Dark Modal",
    description: "Centered dark modal, bold accept button",
    icon: "fa-solid fa-window-maximize",
    preview: { bg: "#0f172a", accent: "#6366f1" },
    generate: (p) => {
      const { headline = DEFAULT_COOKIE_HEADLINE, bodyCopy = DEFAULT_COOKIE_BODY, domain = "",
              acceptText = "Accept", declineText = "Decline", acceptUrl = "", declineUrl = "", closeUrl = "" } = p;
      const overlayBg = cookieOverlayBg(p, "rgba(15,23,42,.85)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<title>${headline} – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
#overlay{position:fixed;inset:0;width:100vw;height:100vh;background:${overlayBg};backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}
#modal{position:relative;max-width:420px;width:100%;background:linear-gradient(165deg,#1e293b,#0f172a);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:40px 36px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.03) inset;animation:pop .35s cubic-bezier(.2,.9,.3,1.2)}
@keyframes pop{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
.close{position:absolute;top:16px;right:16px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.06);color:#94a3b8;border:none;cursor:pointer;font-size:13px;transition:.15s;display:flex;align-items:center;justify-content:center}
.close:hover{background:rgba(255,255,255,.14);color:#fff;transform:rotate(90deg)}
.badge{width:62px;height:62px;margin:0 auto 20px;border-radius:18px;background:linear-gradient(135deg,#6366f1,#4338ca);display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 12px 28px rgba(99,102,241,.45)}
h1{font-size:23px;font-weight:800;color:#fff;margin-bottom:12px;letter-spacing:-.01em}
p{font-size:14px;color:#94a3b8;line-height:1.75;margin-bottom:28px}
.btn{display:block;width:100%;padding:14px;border-radius:12px;font-size:14.5px;font-weight:700;cursor:pointer;border:none;margin-bottom:10px;transition:.18s;letter-spacing:-.005em}
.btn-accept{background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;box-shadow:0 10px 24px rgba(99,102,241,.35)}.btn-accept:hover{transform:translateY(-1px);box-shadow:0 14px 28px rgba(99,102,241,.5)}
.btn-decline{background:rgba(255,255,255,.06);color:#cbd5e1;border:1px solid rgba(255,255,255,.12)}.btn-decline:hover{background:rgba(255,255,255,.12);color:#fff}
@media(max-width:480px){#modal{padding:32px 24px;border-radius:20px}h1{font-size:20px}.badge{width:54px;height:54px;font-size:26px}}
</style></head><body>
<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8">Your website content here</div>
<div id="overlay">
  <div id="modal">
    <button class="close" onclick="closeModal()">✕</button>
    <div class="badge">🍪</div>
    <h1>${headline}</h1>
    <p>${bodyCopy}</p>
    <button class="btn btn-accept" onclick="accept()">${acceptText}</button>
    <button class="btn btn-decline" onclick="decline()">${declineText}</button>
  </div>
</div>
<script>
function accept(){localStorage.setItem('cookie_consent','accepted');var u='${acceptUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function decline(){localStorage.setItem('cookie_consent','declined');var u='${declineUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function closeModal(){var u='${closeUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
</script>
</body></html>`;
    }
  },
  {
    id: "icon-card",
    name: "Icon Card",
    description: "White card with cookie icon",
    icon: "fa-solid fa-cookie-bite",
    preview: { bg: "#ffffff", accent: "#1e293b" },
    generate: (p) => {
      const { headline = DEFAULT_COOKIE_HEADLINE, bodyCopy = DEFAULT_COOKIE_BODY, domain = "",
              acceptText = "Accept", declineText = "Decline", acceptUrl = "", declineUrl = "", closeUrl = "" } = p;
      const overlayBg = cookieOverlayBg(p, "rgba(15,23,42,.55)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<title>${headline} – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
#overlay{position:fixed;inset:0;width:100vw;height:100vh;background:${overlayBg};backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}
#modal{position:relative;max-width:500px;width:100%;background:#fff;border-radius:22px;padding:36px;display:flex;align-items:center;gap:26px;box-shadow:0 30px 80px rgba(15,23,42,.3);animation:pop .35s cubic-bezier(.2,.9,.3,1.2)}
@keyframes pop{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
.close{position:absolute;top:16px;right:16px;width:28px;height:28px;border-radius:50%;background:#f1f5f9;color:#64748b;border:none;cursor:pointer;font-size:12px;transition:.15s}
.close:hover{background:#e2e8f0;transform:rotate(90deg)}
.cb-icon{flex-shrink:0;width:84px;height:84px;border-radius:50%;background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;align-items:center;justify-content:center;font-size:42px;box-shadow:0 12px 28px rgba(251,191,36,.35)}
.content h1{font-size:19px;font-weight:800;color:#1e293b;margin-bottom:8px;letter-spacing:-.01em}
.content p{font-size:13.5px;color:#64748b;line-height:1.65;margin-bottom:20px}
.btns{display:flex;gap:10px}
.btn{padding:11px 22px;border-radius:10px;font-size:13.5px;font-weight:700;cursor:pointer;border:none;transition:.18s}
.btn-accept{background:#1e293b;color:#fff;box-shadow:0 8px 20px rgba(30,41,59,.25)}.btn-accept:hover{background:#0f172a;transform:translateY(-1px)}
.btn-decline{background:#f1f5f9;color:#475569}.btn-decline:hover{background:#e2e8f0}
@media(max-width:480px){#modal{flex-direction:column;text-align:center;padding:30px 24px}.btns{justify-content:center;width:100%}.btn{flex:1}}
</style></head><body>
<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8">Your website content here</div>
<div id="overlay">
  <div id="modal">
    <button class="close" onclick="closeModal()">✕</button>
    <div class="cb-icon">🍪</div>
    <div class="content">
      <h1>${headline}</h1>
      <p>${bodyCopy}</p>
      <div class="btns">
        <button class="btn btn-accept" onclick="accept()">${acceptText}</button>
        <button class="btn btn-decline" onclick="decline()">${declineText}</button>
      </div>
    </div>
  </div>
</div>
<script>
function accept(){localStorage.setItem('cookie_consent','accepted');var u='${acceptUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function decline(){localStorage.setItem('cookie_consent','declined');var u='${declineUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function closeModal(){var u='${closeUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
</script>
</body></html>`;
    }
  },
  {
    id: "pill-buttons",
    name: "Pill Buttons",
    description: "Soft card with rounded pill buttons",
    icon: "fa-solid fa-circle-half-stroke",
    preview: { bg: "#64748b", accent: "#0f172a" },
    generate: (p) => {
      const { headline = DEFAULT_COOKIE_HEADLINE, bodyCopy = DEFAULT_COOKIE_BODY, domain = "",
              acceptText = "Accept", declineText = "Decline", acceptUrl = "", declineUrl = "", closeUrl = "" } = p;
      const overlayBg = cookieOverlayBg(p, "#64748b");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<title>${headline} – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
#overlay{position:fixed;inset:0;width:100vw;height:100vh;background:${overlayBg};backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}
#modal{position:relative;max-width:440px;width:100%;background:#fdfcf9;border-radius:32px;padding:44px 40px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.35);animation:pop .35s cubic-bezier(.2,.9,.3,1.2)}
@keyframes pop{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
.close{position:absolute;top:20px;right:20px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.05);color:#57534e;border:none;cursor:pointer;font-size:12px;transition:.15s}
.close:hover{background:rgba(0,0,0,.1);transform:rotate(90deg)}
.badge{width:56px;height:56px;margin:0 auto 18px;border-radius:50%;background:linear-gradient(135deg,#fde68a,#f59e0b);display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 10px 24px rgba(245,158,11,.35)}
h1{font-size:25px;font-weight:800;color:#1c1917;margin-bottom:14px;letter-spacing:-.01em}
p{font-size:14px;color:#57534e;line-height:1.75;margin-bottom:30px}
.btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.btn{padding:14px 30px;border-radius:100px;font-size:14px;font-weight:700;cursor:pointer;transition:.18s}
.btn-accept{background:#1c1917;color:#fff;border:none;box-shadow:0 10px 24px rgba(0,0,0,.25)}.btn-accept:hover{transform:translateY(-1px);box-shadow:0 14px 28px rgba(0,0,0,.3)}
.btn-decline{background:transparent;color:#1c1917;border:1.5px solid #1c1917}.btn-decline:hover{background:rgba(28,25,23,.06)}
@media(max-width:480px){#modal{padding:36px 26px;border-radius:24px}.btn{width:100%}}
</style></head><body>
<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8">Your website content here</div>
<div id="overlay">
  <div id="modal">
    <button class="close" onclick="closeModal()">✕</button>
    <div class="badge">🍪</div>
    <h1>${headline}</h1>
    <p>${bodyCopy}</p>
    <div class="btns">
      <button class="btn btn-accept" onclick="accept()">${acceptText}</button>
      <button class="btn btn-decline" onclick="decline()">${declineText}</button>
    </div>
  </div>
</div>
<script>
function accept(){localStorage.setItem('cookie_consent','accepted');var u='${acceptUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function decline(){localStorage.setItem('cookie_consent','declined');var u='${declineUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function closeModal(){var u='${closeUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
</script>
</body></html>`;
    }
  },
  {
    id: "outline-decline",
    name: "Outline Decline",
    description: "White modal, outlined decline button",
    icon: "fa-regular fa-square",
    preview: { bg: "#f8fafc", accent: "#1e293b" },
    generate: (p) => {
      const { headline = DEFAULT_COOKIE_HEADLINE, bodyCopy = DEFAULT_COOKIE_BODY, domain = "",
              acceptText = "Accept", declineText = "Decline", acceptUrl = "", declineUrl = "", closeUrl = "" } = p;
      const overlayBg = cookieOverlayBg(p, "rgba(15,23,42,.6)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<title>${headline} – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
#overlay{position:fixed;inset:0;width:100vw;height:100vh;background:${overlayBg};backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}
#modal{position:relative;max-width:420px;width:100%;background:#fff;border-radius:22px;padding:40px 36px;text-align:center;box-shadow:0 30px 80px rgba(15,23,42,.35);animation:pop .35s cubic-bezier(.2,.9,.3,1.2)}
@keyframes pop{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
.close{position:absolute;top:16px;right:16px;width:28px;height:28px;border-radius:50%;background:#f8fafc;color:#475569;border:none;cursor:pointer;font-size:13px;transition:.15s}
.close:hover{background:#eef2ff;color:#1e293b;transform:rotate(90deg)}
.badge{width:60px;height:60px;margin:0 auto 18px;border-radius:16px;background:linear-gradient(135deg,#eef2ff,#e0e7ff);display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 8px 20px rgba(99,102,241,.18)}
h1{font-size:22px;font-weight:800;color:#1e293b;margin-bottom:12px;letter-spacing:-.01em}
p{font-size:14px;color:#64748b;line-height:1.75;margin-bottom:28px}
.btn{display:block;width:100%;padding:13.5px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:10px;transition:.18s}
.btn-accept{background:#1e293b;color:#fff;border:none;box-shadow:0 10px 24px rgba(30,41,59,.25)}.btn-accept:hover{background:#0f172a;transform:translateY(-1px)}
.btn-decline{background:#fff;color:#4f46e5;border:1.5px solid #6366f1}.btn-decline:hover{background:#eef2ff}
@media(max-width:480px){#modal{padding:32px 24px;border-radius:18px}h1{font-size:19px}}
</style></head><body>
<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8">Your website content here</div>
<div id="overlay">
  <div id="modal">
    <button class="close" onclick="closeModal()">✕</button>
    <div class="badge">🍪</div>
    <h1>${headline}</h1>
    <p>${bodyCopy}</p>
    <button class="btn btn-accept" onclick="accept()">${acceptText}</button>
    <button class="btn btn-decline" onclick="decline()">${declineText}</button>
  </div>
</div>
<script>
function accept(){localStorage.setItem('cookie_consent','accepted');var u='${acceptUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function decline(){localStorage.setItem('cookie_consent','declined');var u='${declineUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function closeModal(){var u='${closeUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
</script>
</body></html>`;
    }
  },
  {
    id: "bubble-friendly",
    name: "Bubble Friendly",
    description: "Blue gradient backdrop, playful bubble icon",
    icon: "fa-solid fa-circle-info",
    preview: { bg: "#2f7bc4", accent: "#fff" },
    generate: (p) => {
      const { headline = "Heya! This site uses cookies.",
              bodyCopy = "Cookies allow the website publisher to do useful things like find out whether the computer (and probably its user) has visited the site before.",
              domain = "", acceptText = "Sweet… cookies!", declineText = "Sorry, I'm not a fan. No cookies for me.",
              acceptUrl = "", declineUrl = "", closeUrl = "" } = p;
      const overlayBg = cookieOverlayBg(p, "radial-gradient(circle at 30% 20%,#4a9fe0,#1f5fa8)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<title>${headline} – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
#overlay{position:fixed;inset:0;width:100vw;height:100vh;background:${overlayBg};display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}
#modal{position:relative;max-width:400px;width:100%;background:#fff;border-radius:20px;padding:36px 32px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.35);animation:pop .35s cubic-bezier(.2,.9,.3,1.2)}
@keyframes pop{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
.close{position:absolute;top:-14px;right:-14px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.9);color:#2f7bc4;border:none;cursor:pointer;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.2)}
.bubble{position:relative;width:78px;height:78px;margin:0 auto 18px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#bfe3ff,#7fc2f0);display:flex;align-items:center;justify-content:center;font-size:32px}
.bubble::before,.bubble::after{content:'';position:absolute;border-radius:50%;background:rgba(127,194,240,.55)}
.bubble::before{width:18px;height:18px;top:-8px;right:-4px}
.bubble::after{width:10px;height:10px;top:-16px;right:10px}
h1{font-size:21px;font-weight:800;color:#1e293b;margin-bottom:12px}
p{font-size:13.5px;color:#94a3b8;line-height:1.7;margin-bottom:24px}
.btn-accept{display:block;width:100%;padding:13px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;border:none;background:#2f7bc4;color:#fff;box-shadow:0 10px 22px rgba(47,123,196,.4);transition:.18s;margin-bottom:14px}
.btn-accept:hover{background:#256aab;transform:translateY(-1px)}
.btn-decline{display:block;width:100%;background:none;border:none;color:#94a3b8;font-size:12px;text-decoration:underline;cursor:pointer}
.btn-decline:hover{color:#64748b}
@media(max-width:480px){#modal{padding:30px 22px;border-radius:16px}h1{font-size:18px}}
</style></head><body>
<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8">Your website content here</div>
<div id="overlay">
  <div id="modal">
    <button class="close" onclick="closeModal()">✕</button>
    <div class="bubble">🍪</div>
    <h1>${headline}</h1>
    <p>${bodyCopy}</p>
    <button class="btn-accept" onclick="accept()">${acceptText}</button>
    <button class="btn-decline" onclick="decline()">${declineText}</button>
  </div>
</div>
<script>
function accept(){localStorage.setItem('cookie_consent','accepted');var u='${acceptUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function decline(){localStorage.setItem('cookie_consent','declined');var u='${declineUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function closeModal(){var u='${closeUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
</script>
</body></html>`;
    }
  },
  {
    id: "bordered-cookies",
    name: "Bordered Cookies",
    description: "Bold black border, cookie illustration, Preferences button",
    icon: "fa-regular fa-square",
    preview: { bg: "#ffffff", accent: "#1c1917" },
    generate: (p) => {
      const { headline = "Cookies", bodyCopy = DEFAULT_COOKIE_BODY, domain = "",
              acceptText = "Accept", declineText = "Preferences", acceptUrl = "", declineUrl = "", closeUrl = "" } = p;
      const overlayBg = cookieOverlayBg(p, "rgba(15,23,42,.55)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<title>${headline} – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
#overlay{position:fixed;inset:0;width:100vw;height:100vh;background:${overlayBg};backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}
#modal{position:relative;max-width:440px;width:100%;background:#fff;border:2.5px solid #1c1917;border-radius:14px;padding:32px;text-align:center;box-shadow:8px 8px 0 rgba(28,25,23,.12);animation:pop .35s cubic-bezier(.2,.9,.3,1.2)}
@keyframes pop{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
.close{position:absolute;top:14px;right:14px;width:28px;height:28px;border:2px solid #1c1917;border-radius:6px;background:#fff;color:#1c1917;cursor:pointer;font-size:13px;font-weight:700}
.content h1{font-size:24px;font-weight:800;color:#1c1917;margin-bottom:10px}
.content p{font-size:13px;color:#57534e;line-height:1.6;margin-bottom:18px}
.btns{display:flex;gap:10px;justify-content:center}
.btn{padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:2px solid #1c1917;transition:.15s}
.btn-accept{background:#1c1917;color:#fff}.btn-accept:hover{background:#3a3532}
.btn-decline{background:#fde68a;color:#1c1917}.btn-decline:hover{background:#fcd34d}
@media(max-width:480px){#modal{padding:28px 22px}.btns{flex-direction:column}}
</style></head><body>
<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8">Your website content here</div>
<div id="overlay">
  <div id="modal">
    <button class="close" onclick="closeModal()">✕</button>
    <div class="content">
      <h1>${headline}</h1>
      <p>${bodyCopy}</p>
      <div class="btns">
        <button class="btn btn-accept" onclick="accept()">${acceptText}</button>
        <button class="btn btn-decline" onclick="decline()">${declineText}</button>
      </div>
    </div>
  </div>
</div>
<script>
function accept(){localStorage.setItem('cookie_consent','accepted');var u='${acceptUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function decline(){localStorage.setItem('cookie_consent','declined');var u='${declineUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function closeModal(){var u='${closeUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
</script>
</body></html>`;
    }
  },
  {
    id: "diagonal-stripes",
    name: "Diagonal Stripes",
    description: "Striped backdrop, three-button consent panel",
    icon: "fa-solid fa-bars-staggered",
    preview: { bg: "#6b7560", accent: "#2563eb" },
    generate: (p) => {
      const { headline = "We value your privacy",
              bodyCopy = `We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.`,
              domain = "", acceptText = "Accept All", declineText = "Reject All", acceptUrl = "", declineUrl = "", closeUrl = "" } = p;
      const overlayBg = cookieOverlayBg(p, "repeating-linear-gradient(135deg,#6b7560,#6b7560 16px,#5e6754 16px,#5e6754 32px)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<title>${headline} – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
#overlay{position:fixed;inset:0;width:100vw;height:100vh;background:${overlayBg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;z-index:9999}
.welcome{color:#fff;font-size:14px;font-weight:700;letter-spacing:.2em;margin-bottom:24px;text-transform:uppercase;opacity:.85}
#modal{position:relative;max-width:460px;width:100%;background:#fff;border-radius:14px;padding:28px 30px;box-shadow:0 30px 80px rgba(0,0,0,.35);animation:pop .35s cubic-bezier(.2,.9,.3,1.2)}
@keyframes pop{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
h1{font-size:16px;font-weight:800;color:#1e293b;margin-bottom:8px}
p{font-size:12.5px;color:#64748b;line-height:1.6;margin-bottom:18px}
.btns{display:flex;gap:8px;flex-wrap:wrap}
.btn{flex:1;padding:9px 14px;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer;transition:.15s;white-space:nowrap}
.btn-customize{background:#fff;color:#334155;border:1.5px solid #cbd5e1}.btn-customize:hover{background:#f8fafc}
.btn-decline{background:#fff;color:#334155;border:1.5px solid #cbd5e1}.btn-decline:hover{background:#f8fafc}
.btn-accept{background:#2563eb;color:#fff;border:none}.btn-accept:hover{background:#1d4ed8}
@media(max-width:480px){.btns{flex-direction:column}.welcome{font-size:12px}}
</style></head><body>
<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8">Your website content here</div>
<div id="overlay">
  <div id="modal">
    <h1>${headline}</h1>
    <p>${bodyCopy}</p>
    <div class="btns">
      <button class="btn btn-customize" onclick="accept()">Customize</button>
      <button class="btn btn-decline" onclick="decline()">${declineText}</button>
      <button class="btn btn-accept" onclick="accept()">${acceptText}</button>
    </div>
  </div>
</div>
<script>
function accept(){localStorage.setItem('cookie_consent','accepted');var u='${acceptUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function decline(){localStorage.setItem('cookie_consent','declined');var u='${declineUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function closeModal(){var u='${closeUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
</script>
</body></html>`;
    }
  },
  {
    id: "brand-privacy",
    name: "Brand Privacy",
    description: "Logo row, footer links, three-tier consent",
    icon: "fa-solid fa-globe",
    preview: { bg: "#0f172a", accent: "#10b981" },
    generate: (p) => {
      const { headline = "Privacy Settings",
              bodyCopy = "To improve the user experience, to measure our success and to provide personalized advertising, we use cookies, pixels, tags and similar technologies.",
              domain = "Your Brand", acceptText = "Accept All", declineText = "Deny", acceptUrl = "", declineUrl = "", closeUrl = "", privacyUrl = "/privacy" } = p;
      const overlayBg = cookieOverlayBg(p, "rgba(15,23,42,.6)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<title>${headline} – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
#overlay{position:fixed;inset:0;width:100vw;height:100vh;background:${overlayBg};backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}
#modal{position:relative;max-width:520px;width:100%;background:#fff;border-radius:14px;padding:28px 32px;box-shadow:0 30px 80px rgba(0,0,0,.35);animation:pop .35s cubic-bezier(.2,.9,.3,1.2)}
@keyframes pop{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
.brandrow{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.brandrow .name{font-weight:800;font-size:14px;color:#1e293b}
.brandrow i{color:#64748b;font-size:14px}
h1{font-size:16px;font-weight:800;color:#1e293b;margin-bottom:8px}
p{font-size:12.5px;color:#64748b;line-height:1.7;margin-bottom:6px}
p a{color:#2563eb;text-decoration:underline}
.footlinks{font-size:11px;color:#94a3b8;margin:12px 0 16px}
.footlinks a{color:#94a3b8;text-decoration:underline;margin-right:10px}
.btns{display:flex;gap:8px;flex-wrap:wrap}
.btn{flex:1;padding:10px 14px;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer;transition:.15s;border:none;white-space:nowrap}
.btn-individual{background:#e2e8f0;color:#334155}.btn-individual:hover{background:#cbd5e1}
.btn-decline{background:#e9d5e7;color:#6b2154}.btn-decline:hover{background:#ddb9da}
.btn-accept{background:#10b981;color:#fff}.btn-accept:hover{background:#0d9668}
@media(max-width:480px){.btns{flex-direction:column}}
</style></head><body>
<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8">Your website content here</div>
<div id="overlay">
  <div id="modal">
    <div class="brandrow"><span class="name">${domain}</span><i class="fa-solid fa-globe"></i></div>
    <h1>${headline}</h1>
    <p>${bodyCopy} You can find further information in our <a href="${privacyUrl}">data protection declaration</a>, where you can also adjust your settings at any time.</p>
    <div class="footlinks"><a href="${privacyUrl}">Privacy Policy</a><a href="#">Imprint</a></div>
    <div class="btns">
      <button class="btn btn-individual" onclick="accept()">Individual Settings</button>
      <button class="btn btn-decline" onclick="decline()">${declineText}</button>
      <button class="btn btn-accept" onclick="accept()">${acceptText}</button>
    </div>
  </div>
</div>
<script>
function accept(){localStorage.setItem('cookie_consent','accepted');var u='${acceptUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function decline(){localStorage.setItem('cookie_consent','declined');var u='${declineUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function closeModal(){var u='${closeUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
</script>
</body></html>`;
    }
  },
  {
    id: "minimal-bar",
    name: "Minimal Bar",
    description: "Clean heading, simple two-button bar",
    icon: "fa-solid fa-minus",
    preview: { bg: "#f8fafc", accent: "#2563eb" },
    generate: (p) => {
      const { headline = DEFAULT_COOKIE_HEADLINE,
              bodyCopy = `We use cookies to give you the best possible experience with ${p.domain || "this site"}. Some are essential for this site to function; others help us understand how you use the site, so we can improve it.`,
              domain = "", acceptText = "Accept All Cookies", declineText = "Manage my preferences", acceptUrl = "", declineUrl = "", closeUrl = "", privacyUrl = "/privacy" } = p;
      const overlayBg = cookieOverlayBg(p, "rgba(15,23,42,.5)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<title>${headline} – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Inter',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
#overlay{position:fixed;inset:0;width:100vw;height:100vh;background:${overlayBg};backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}
#modal{position:relative;max-width:560px;width:100%;background:#fff;border-radius:14px;padding:28px 30px;box-shadow:0 30px 80px rgba(0,0,0,.3);text-align:center;animation:pop .35s cubic-bezier(.2,.9,.3,1.2)}
@keyframes pop{from{opacity:0;transform:scale(.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
h1{font-size:17px;font-weight:700;color:#1e293b;margin-bottom:8px}
p{font-size:13px;color:#475569;line-height:1.7;margin-bottom:18px;text-align:center}
p a{color:#2563eb;text-decoration:underline}
.btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.btn{padding:11px 22px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;transition:.15s}
.btn-decline{background:#fff;color:#2563eb;border:1.5px solid #2563eb}.btn-decline:hover{background:#eff6ff}
.btn-accept{background:#2563eb;color:#fff;border:none}.btn-accept:hover{background:#1d4ed8}
@media(max-width:480px){.btns{flex-direction:column}.btn{width:100%}}
</style></head><body>
<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8">Your website content here</div>
<div id="overlay">
  <div id="modal">
    <h1>${headline}</h1>
    <p>${bodyCopy} We may also use cookies for targeting purposes. Click "Accept all cookies" to proceed as specified, or click "Manage my preferences" to choose the types of cookies you will accept. <a href="${privacyUrl}">Cookie policy</a></p>
    <div class="btns">
      <button class="btn btn-decline" onclick="decline()">${declineText}</button>
      <button class="btn btn-accept" onclick="accept()">${acceptText}</button>
    </div>
  </div>
</div>
<script>
function accept(){localStorage.setItem('cookie_consent','accepted');var u='${acceptUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function decline(){localStorage.setItem('cookie_consent','declined');var u='${declineUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function closeModal(){var u='${closeUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
</script>
</body></html>`;
    }
  }
];

// ─── AI FULL-DESIGN COOKIE BANNER ───────────────────────────────────────────
// Built from AI-chosen icon/accent-color/animation rather than a fixed template.
// Always centered in the viewport (never anchored to a corner/edge).

const AI_ICONS = {
  shield: "fa-solid fa-shield-halved", lock: "fa-solid fa-lock", sparkles: "fa-solid fa-wand-magic-sparkles",
  bell: "fa-solid fa-bell", leaf: "fa-solid fa-leaf", heart: "fa-solid fa-heart", globe: "fa-solid fa-globe",
  key: "fa-solid fa-key", eye: "fa-solid fa-eye", info: "fa-solid fa-circle-info",
  chart: "fa-solid fa-chart-line", star: "fa-solid fa-star"
};

const AI_ANIMATIONS = {
  "fade-scale": { name: "aiPop",      css: "@keyframes aiPop{from{opacity:0;transform:scale(.9) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}" },
  "slide-up":   { name: "aiSlideUp",  css: "@keyframes aiSlideUp{from{opacity:0;transform:translateY(48px)}to{opacity:1;transform:translateY(0)}}" },
  "slide-down": { name: "aiSlideDown",css: "@keyframes aiSlideDown{from{opacity:0;transform:translateY(-48px)}to{opacity:1;transform:translateY(0)}}" },
  "zoom":       { name: "aiZoom",     css: "@keyframes aiZoom{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}" }
};

export function generateAIDesign(p) {
  const {
    headline = DEFAULT_COOKIE_HEADLINE, bodyCopy = DEFAULT_COOKIE_BODY, domain = "",
    acceptText = "Accept", declineText = "Decline", acceptUrl = "", declineUrl = "", closeUrl = "",
    icon = "sparkles", accentColor = "#6366f1", animation = "fade-scale"
  } = p;
  const overlayBg = cookieOverlayBg(p, "rgba(15,23,42,.6)");
  const iconClass = AI_ICONS[icon] || AI_ICONS.sparkles;
  const anim = AI_ANIMATIONS[animation] || AI_ANIMATIONS["fade-scale"];

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>
<title>${headline} – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{font-family:'Inter',-apple-system,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
/* Overlay always centers the modal both horizontally and vertically — never anchored to an edge/corner. */
#overlay{position:fixed;inset:0;width:100vw;height:100vh;background:${overlayBg};backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}
#modal{position:relative;max-width:440px;width:100%;background:#fff;border-radius:20px;padding:40px 36px;text-align:center;box-shadow:0 30px 80px rgba(15,23,42,.35);animation:${anim.name} .4s cubic-bezier(.2,.9,.3,1.2)}
${anim.css}
.close{position:absolute;top:16px;right:16px;width:28px;height:28px;border-radius:50%;background:#f8fafc;color:#64748b;border:none;cursor:pointer;font-size:12px;transition:.15s;display:flex;align-items:center;justify-content:center}
.close:hover{background:#f1f5f9;color:#1e293b;transform:rotate(90deg)}
.badge{width:56px;height:56px;margin:0 auto 20px;border-radius:14px;background:${accentColor}14;display:flex;align-items:center;justify-content:center;font-size:22px;color:${accentColor}}
h1{font-size:20px;font-weight:700;color:#0f172a;margin-bottom:12px;letter-spacing:-.01em}
p{font-size:14px;color:#64748b;line-height:1.7;margin-bottom:26px}
.btn{display:block;width:100%;padding:13px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:10px;transition:.18s;border:none}
.btn-accept{background:${accentColor};color:#fff;box-shadow:0 8px 20px ${accentColor}40}.btn-accept:hover{transform:translateY(-1px);filter:brightness(0.93)}
.btn-decline{background:#fff;color:${accentColor};border:1.5px solid ${accentColor}}.btn-decline:hover{background:${accentColor}11}
@media(max-width:480px){#modal{padding:32px 24px;border-radius:16px}h1{font-size:18px}}
</style></head><body>
<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#94a3b8">Your website content here</div>
<div id="overlay">
  <div id="modal">
    <button class="close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
    <div class="badge"><i class="${iconClass}"></i></div>
    <h1>${headline}</h1>
    <p>${bodyCopy}</p>
    <button class="btn btn-accept" onclick="accept()">${acceptText}</button>
    <button class="btn btn-decline" onclick="decline()">${declineText}</button>
  </div>
</div>
<script>
function accept(){localStorage.setItem('cookie_consent','accepted');var u='${acceptUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function decline(){localStorage.setItem('cookie_consent','declined');var u='${declineUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
function closeModal(){var u='${closeUrl}';if(u){top.location.href=u}else{document.getElementById('overlay').remove()}}
</script>
</body></html>`;
}

// ─── AGE VERIFICATION TEMPLATES ─────────────────────────────────────────────
// Simple confirm / exit age gates: a heading, sub-content and two buttons.
// Confirm remembers the visitor for the session and reveals the page; Exit
// redirects away. Every template shares the same script, supports a background
// (solid dark colour or an image with a dark overlay), and Advanced styling.

const AGE_STORAGE_KEY = "age_verified";

// Allow only http(s) or root-relative redirect targets; fall back otherwise.
function ageSafeRedirect(url) {
  const fallback = "https://www.google.com";
  if (!url) return fallback;
  const t = String(url).trim();
  return (/^https?:\/\//i.test(t) || t.startsWith("/")) ? t : fallback;
}

// Full-page background: a solid colour, or an image with a dark scrim at the
// chosen opacity.
function ageOverlayBg({ bgType, bgColor, bgImage, bgOpacity = 0.6 }, fallbackColor) {
  if (bgType === "image" && bgImage) {
    return `linear-gradient(rgba(15,23,42,${bgOpacity}),rgba(15,23,42,${bgOpacity})), url('${bgImage}') center/cover no-repeat`;
  }
  return bgColor || fallbackColor;
}

// Confirm/exit behaviour. Confirm → remember; then go to the confirm URL if set,
// otherwise reveal the page. Exit → go to the exit URL (defaults to google).
function ageScript(confirmUrl, exitUrl) {
  const CU = confirmUrl ? ageSafeRedirect(confirmUrl) : "";
  const XU = ageSafeRedirect(exitUrl);
  return `<script>(function(){
  var KEY=${JSON.stringify(AGE_STORAGE_KEY)},CU=${JSON.stringify(CU)},XU=${JSON.stringify(XU)};
  function reveal(){var g=document.getElementById('age-gate');if(g&&g.parentNode)g.parentNode.removeChild(g);document.documentElement.style.overflow='';document.body.style.overflow='';}
  try{if(sessionStorage.getItem(KEY)==='true')reveal();}catch(e){}
  window.__ageConfirm=function(){try{sessionStorage.setItem(KEY,'true');}catch(e){}if(CU){top.location.href=CU;}else{reveal();}};
  window.__ageExit=function(){top.location.href=XU;};
})();</script>`;
}

function ageFormatCSS(format) {
  return {
    textTransform: format === "uppercase" ? "uppercase" : "none",
    fontStyle: format === "italic" ? "italic" : "normal"
  };
}

// Advanced styling overrides for the heading, sub-content, box and buttons.
export function applyAgeAdvancedStyles(html, adv = {}) {
  if (!adv.enabled) return html;
  const {
    headingColor, subColor, boxColor,
    fontSize, fontWeight, format,
    subFontSize, subFontWeight, subFormat,
    confirmColor, confirmTextColor, exitColor, exitTextColor,
    btnFontSize, btnFontWeight, btnFormat,
    buttonWidth, buttonPaddingX, buttonPaddingY,
    boxRadius, btnRadius, boxShadow
  } = adv;
  const h = ageFormatCSS(format), s = ageFormatCSS(subFormat), b = ageFormatCSS(btnFormat);
  const btnWidthCSS = buttonWidth === "full"
    ? "width:100% !important;display:block !important;"
    : (buttonWidth ? `width:${buttonWidth}px !important;` : "");
  const btnPad = (buttonPaddingX || buttonPaddingY)
    ? `padding:${buttonPaddingY || 14}px ${buttonPaddingX || 24}px !important;` : "";
  const shadowCSS = boxShadow === "none" ? "box-shadow:none !important;"
    : boxShadow === "strong" ? "box-shadow:0 30px 70px rgba(0,0,0,.45) !important;"
    : boxShadow === "soft" ? "box-shadow:0 12px 30px rgba(0,0,0,.18) !important;" : "";
  const rules = `
#age-box{${boxColor ? `background:${boxColor} !important;` : ""}${boxRadius ? `border-radius:${boxRadius}px !important;` : ""}${shadowCSS}}
#age-gate h1{${headingColor ? `color:${headingColor} !important;` : ""}${fontSize ? `font-size:${fontSize}px !important;` : ""}${fontWeight ? `font-weight:${fontWeight} !important;` : ""}text-transform:${h.textTransform} !important;font-style:${h.fontStyle} !important;}
#age-gate .age-sub{${subColor ? `color:${subColor} !important;` : ""}${subFontSize ? `font-size:${subFontSize}px !important;` : ""}${subFontWeight ? `font-weight:${subFontWeight} !important;` : ""}text-transform:${s.textTransform} !important;font-style:${s.fontStyle} !important;}
#age-gate .btn-confirm,#age-gate .btn-exit{${btnFontSize ? `font-size:${btnFontSize}px !important;` : ""}${btnFontWeight ? `font-weight:${btnFontWeight} !important;` : ""}text-transform:${b.textTransform} !important;font-style:${b.fontStyle} !important;${btnWidthCSS}${btnPad}${btnRadius ? `border-radius:${btnRadius}px !important;` : ""}}
#age-gate .btn-confirm{${confirmColor ? `background:${confirmColor} !important;border-color:${confirmColor} !important;` : ""}${confirmTextColor ? `color:${confirmTextColor} !important;` : ""}}
#age-gate .btn-exit{${exitColor ? `background:${exitColor} !important;border-color:${exitColor} !important;` : ""}${exitTextColor ? `color:${exitTextColor} !important;` : ""}}
`;
  return html.replace("</style>", rules + "</style>");
}

// Shared defaults for every template.
const AGE_DEFAULTS = {
  headline: "Age Verification",
  bodyCopy: "You must be 18 years or older to enter this site. Please verify your age to continue.",
  ctaText: "I am 18+",
  exitText: "Exit",
  redirectUrl: "https://www.google.com",
  domain: ""
};

export const AGE_TEMPLATES = [
  {
    id: "accent-bar",
    name: "Accent Bar",
    description: "White modal with a colored side accent",
    icon: "fa-solid fa-grip-lines-vertical",
    preview: { bg: "#f1f5f9", accent: "#f97316" },
    generate: (p) => {
      const { headline = AGE_DEFAULTS.headline, bodyCopy = AGE_DEFAULTS.bodyCopy, ctaText = AGE_DEFAULTS.ctaText,
              exitText = AGE_DEFAULTS.exitText, confirmUrl = "", exitUrl = "", domain = "" } = p;
      const bg = ageOverlayBg(p, "rgba(15,23,42,.5)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/>
<title>Age Verification – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,system-ui,sans-serif;overflow:hidden}
#age-gate{position:fixed;inset:0;background:${bg};display:flex;align-items:center;justify-content:center;padding:20px;z-index:99999}
#age-box{background:#fff;border-left:6px solid #f97316;border-radius:14px;padding:40px 36px;max-width:480px;width:100%;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,.3)}
#age-gate h1{font-size:26px;font-weight:800;color:#0f172a;margin-bottom:14px}
.age-sub{font-size:15px;color:#475569;line-height:1.7;margin-bottom:26px}
.age-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.btn-confirm,.btn-exit{padding:13px 28px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;border:none;transition:.15s}
.btn-confirm{background:#f97316;color:#fff}.btn-confirm:hover{background:#ea670c}
.btn-exit{background:#e2e8f0;color:#334155}.btn-exit:hover{background:#cbd5e1}
</style></head><body>
<div id="age-gate"><div id="age-box">
  <h1>${headline}</h1>
  <p class="age-sub">${bodyCopy}</p>
  <div class="age-btns">
    <button class="btn-confirm" onclick="__ageConfirm()">${ctaText}</button>
    <button class="btn-exit" onclick="__ageExit()">${exitText}</button>
  </div>
</div></div>
${ageScript(confirmUrl, exitUrl)}
</body></html>`;
    }
  },
  {
    id: "bold-center",
    name: "Bold Center",
    description: "Big bold heading, two solid buttons",
    icon: "fa-solid fa-heading",
    preview: { bg: "#ffffff", accent: "#2563eb" },
    generate: (p) => {
      const { headline = AGE_DEFAULTS.headline, bodyCopy = AGE_DEFAULTS.bodyCopy, ctaText = AGE_DEFAULTS.ctaText,
              exitText = AGE_DEFAULTS.exitText, confirmUrl = "", exitUrl = "", domain = "" } = p;
      const bg = ageOverlayBg(p, "rgba(15,23,42,.55)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/>
<title>Age Verification – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,system-ui,sans-serif;overflow:hidden}
#age-gate{position:fixed;inset:0;background:${bg};display:flex;align-items:center;justify-content:center;padding:20px;z-index:99999}
#age-box{background:#fff;border-radius:18px;padding:48px 44px;max-width:520px;width:100%;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,.3)}
#age-gate h1{font-size:36px;font-weight:800;color:#0f172a;margin-bottom:18px;letter-spacing:-.02em}
.age-sub{font-size:16px;color:#475569;line-height:1.7;margin-bottom:30px}
.age-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.btn-confirm,.btn-exit{padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;border:none;color:#fff;transition:.15s}
.btn-confirm{background:#2563eb}.btn-confirm:hover{background:#1d4ed8}
.btn-exit{background:#ef4444}.btn-exit:hover{background:#dc2626}
</style></head><body>
<div id="age-gate"><div id="age-box">
  <h1>${headline}</h1>
  <p class="age-sub">${bodyCopy}</p>
  <div class="age-btns">
    <button class="btn-confirm" onclick="__ageConfirm()">${ctaText}</button>
    <button class="btn-exit" onclick="__ageExit()">${exitText}</button>
  </div>
</div></div>
${ageScript(confirmUrl, exitUrl)}
</body></html>`;
    }
  },
  {
    id: "dark-compact",
    name: "Dark Compact",
    description: "Dark box, bold accent heading, outlined buttons",
    icon: "fa-solid fa-moon",
    preview: { bg: "#1e1b4b", accent: "#ec4899" },
    generate: (p) => {
      const { headline = AGE_DEFAULTS.headline, bodyCopy = AGE_DEFAULTS.bodyCopy, ctaText = AGE_DEFAULTS.ctaText,
              exitText = AGE_DEFAULTS.exitText, confirmUrl = "", exitUrl = "", domain = "" } = p;
      const bg = ageOverlayBg(p, "rgba(15,23,42,.65)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/>
<title>Age Verification – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,system-ui,sans-serif;overflow:hidden}
#age-gate{position:fixed;inset:0;background:${bg};display:flex;align-items:center;justify-content:center;padding:20px;z-index:99999}
#age-box{background:#1e1b4b;border-radius:8px;padding:40px 36px;max-width:360px;width:100%;text-align:center}
#age-gate h1{font-size:30px;font-weight:800;color:#ec4899;margin-bottom:12px;letter-spacing:.02em}
.age-sub{font-size:13px;color:#a5b4cf;line-height:1.7;margin-bottom:24px}
.age-btns{display:flex;gap:10px;justify-content:center}
.btn-confirm,.btn-exit{padding:9px 18px;border-radius:5px;font-size:12px;font-weight:700;cursor:pointer;background:transparent;color:#fff;border:1px solid rgba(255,255,255,.45);transition:.15s}
.btn-confirm:hover,.btn-exit:hover{background:rgba(255,255,255,.12)}
</style></head><body>
<div id="age-gate"><div id="age-box">
  <h1>${headline}</h1>
  <p class="age-sub">${bodyCopy}</p>
  <div class="age-btns">
    <button class="btn-confirm" onclick="__ageConfirm()">${ctaText}</button>
    <button class="btn-exit" onclick="__ageExit()">${exitText}</button>
  </div>
</div></div>
${ageScript(confirmUrl, exitUrl)}
</body></html>`;
    }
  },
  {
    id: "hero-bg",
    name: "Hero Background",
    description: "Full-screen background, text overlay",
    icon: "fa-solid fa-image",
    preview: { bg: "#1c1917", accent: "#e11d48" },
    generate: (p) => {
      const { headline = AGE_DEFAULTS.headline, bodyCopy = AGE_DEFAULTS.bodyCopy, ctaText = AGE_DEFAULTS.ctaText,
              exitText = AGE_DEFAULTS.exitText, confirmUrl = "", exitUrl = "", domain = "" } = p;
      const bg = ageOverlayBg(p, "#1c1917");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/>
<title>Age Verification – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,system-ui,sans-serif;overflow:hidden}
#age-gate{position:fixed;inset:0;background:${bg};display:flex;align-items:center;justify-content:center;padding:24px;z-index:99999}
#age-box{background:transparent;max-width:440px;width:100%;text-align:center;color:#fff}
#age-gate h1{font-size:32px;font-weight:800;margin-bottom:14px}
.age-sub{font-size:15px;color:rgba(255,255,255,.85);line-height:1.7;margin-bottom:26px}
.age-btns{display:flex;flex-direction:column;gap:10px;max-width:300px;margin:0 auto}
.btn-confirm,.btn-exit{padding:13px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;border:none;color:#fff;transition:.15s}
.btn-confirm{background:#e11d48}.btn-confirm:hover{background:#be123c}
.btn-exit{background:rgba(255,255,255,.18)}.btn-exit:hover{background:rgba(255,255,255,.28)}
</style></head><body>
<div id="age-gate"><div id="age-box">
  <h1>${headline}</h1>
  <p class="age-sub">${bodyCopy}</p>
  <div class="age-btns">
    <button class="btn-confirm" onclick="__ageConfirm()">${ctaText}</button>
    <button class="btn-exit" onclick="__ageExit()">${exitText}</button>
  </div>
</div></div>
${ageScript(confirmUrl, exitUrl)}
</body></html>`;
    }
  },
  {
    id: "ecommerce-overlay",
    name: "Store Overlay",
    description: "Uppercase heading, divider, OR split buttons",
    icon: "fa-solid fa-store",
    preview: { bg: "#e2e8f0", accent: "#22c55e" },
    generate: (p) => {
      const { headline = AGE_DEFAULTS.headline, bodyCopy = AGE_DEFAULTS.bodyCopy, ctaText = AGE_DEFAULTS.ctaText,
              exitText = AGE_DEFAULTS.exitText, confirmUrl = "", exitUrl = "", domain = "" } = p;
      const bg = ageOverlayBg(p, "rgba(15,23,42,.55)");
      return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/>
<title>Age Verification – ${domain}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,system-ui,sans-serif;overflow:hidden}
#age-gate{position:fixed;inset:0;background:${bg};display:flex;align-items:center;justify-content:center;padding:20px;z-index:99999}
#age-box{background:#fff;border-radius:6px;padding:36px 40px;max-width:440px;width:100%;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,.3)}
#age-gate h1{font-size:17px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:.08em;padding-bottom:16px;border-bottom:1px solid #e2e8f0;margin-bottom:18px}
.age-sub{font-size:14px;color:#475569;line-height:1.7;margin-bottom:24px}
.btn-confirm,.btn-exit{display:block;width:100%;padding:14px;border-radius:4px;font-size:14px;font-weight:700;cursor:pointer;border:none;color:#fff;transition:.15s}
.btn-confirm{background:#22c55e}.btn-confirm:hover{background:#16a34a}
.btn-exit{background:#f97316}.btn-exit:hover{background:#ea670c}
.age-or{display:flex;align-items:center;gap:10px;color:#94a3b8;font-size:11px;letter-spacing:.1em;margin:12px 0}
.age-or::before,.age-or::after{content:"";flex:1;height:1px;background:#e2e8f0}
</style></head><body>
<div id="age-gate"><div id="age-box">
  <h1>${headline}</h1>
  <p class="age-sub">${bodyCopy}</p>
  <button class="btn-confirm" onclick="__ageConfirm()">${ctaText}</button>
  <div class="age-or">OR</div>
  <button class="btn-exit" onclick="__ageExit()">${exitText}</button>
</div></div>
${ageScript(confirmUrl, exitUrl)}
</body></html>`;
    }
  }
];

// ─── EMAIL NEWSLETTER (SIGN-UP POPUP) TEMPLATES ──────────────────────────────
// Email-capture popups styled after real e-commerce newsletter modals.
// Roboto / Poppins fonts, Font Awesome icons, an Unsplash default image, and a
// form that POSTs the email to a webhook (e.g. your Google Sheet) or redirects.

const NL_DEFAULTS = {
  headline: "Subscribe to our newsletter",
  bodyCopy: "Sign up for exclusive offers, news and discounts.",
  ctaText: "Subscribe",
  placeholder: "Your email address",
  image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80"
};

const NL_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"/><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Roboto:wght@400;500&display=swap" rel="stylesheet"/><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>`;
function NL_HEAD(headline, domain) {
  return `<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/><title>${headline} – ${domain}</title>${NL_FONTS}`;
}
const NL_BASE = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Roboto',system-ui,Arial,sans-serif}#nl-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;z-index:99999}.nl-close{position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:50%;border:none;background:rgba(0,0,0,.06);color:#6b7280;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center}.nl-close:hover{filter:brightness(.92)}`;

// Full-page background behind the popup: solid colour, or image with a dark scrim.
function nlOverlayBg({ bgType, bgColor, bgImage, bgOpacity = 0.6 }, fallback) {
  if (bgType === "image" && bgImage) {
    return `linear-gradient(rgba(15,23,42,${bgOpacity}),rgba(15,23,42,${bgOpacity})),url('${bgImage}') center/cover no-repeat`;
  }
  return bgColor || fallback;
}

// Shared form behaviour: close, skip, and submit (POST to webhook / redirect).
function nlScript(actionUrl, redirectUrl, closeUrl) {
  return `<script>(function(){
  var RD=${JSON.stringify(redirectUrl || "")},AU=${JSON.stringify(actionUrl || "")},CL=${JSON.stringify(closeUrl || "")};
  var ov=document.getElementById('nl-overlay'),box=document.getElementById('nl-box'),x=document.getElementById('nl-close'),sk=document.getElementById('nl-skip'),f=document.getElementById('nl-form');
  function hide(){if(ov)ov.style.display='none';}
  if(x)x.addEventListener('click',function(){if(CL){top.location.href=CL;}else{hide();}});
  if(sk)sk.addEventListener('click',hide);
  if(f)f.addEventListener('submit',function(e){e.preventDefault();var inp=f.querySelector('input[type=email],input[type=tel]'),em=inp?inp.value:'';
    function done(){if(RD){top.location.href=RD;return;}if(box){box.innerHTML='';var w=document.createElement('div');w.setAttribute('style','padding:46px 32px;text-align:center');w.innerHTML='<div style="font-size:46px;color:#22c55e;margin-bottom:10px">&#10003;</div>';var h=document.createElement('h2');h.setAttribute('style','font-family:Poppins,sans-serif;margin:0 0 8px');h.textContent='Thank you!';var p=document.createElement('p');p.setAttribute('style','color:#64748b;margin:0');p.textContent='You are subscribed.';w.appendChild(h);w.appendChild(p);box.appendChild(w);}}
    if(AU){
      try{
        var ifr=document.createElement('iframe');ifr.name='nl_sink';ifr.style.display='none';document.body.appendChild(ifr);
        var fm=document.createElement('form');fm.method='POST';fm.action=AU;fm.target='nl_sink';fm.style.display='none';
        function add(n,v){var i=document.createElement('input');i.type='hidden';i.name=n;i.value=v;fm.appendChild(i);}
        add('email',em);add('timestamp',new Date().toISOString());
        document.body.appendChild(fm);fm.submit();
      }catch(_){ }
      // give the POST a moment to leave, then redirect / show thanks.
      setTimeout(done, RD ? 800 : 250);
    }else{ done(); }
  });
})();</script>`;
}

// Advanced styling overrides for the popup heading, sub-content, box and button.
export function applyNewsletterAdvancedStyles(html, adv = {}) {
  if (!adv.enabled) return html;
  const {
    headingColor, subColor, boxColor, btnColor, btnTextColor,
    fontSize, fontWeight, format, subFontSize, subFontWeight, subFormat,
    btnFontSize, btnFontWeight, btnFormat, boxRadius, btnRadius
  } = adv;
  const h = ageFormatCSS(format), s = ageFormatCSS(subFormat), b = ageFormatCSS(btnFormat);
  const rules = `
#nl-box{${boxColor ? `background:${boxColor} !important;` : ""}${boxRadius ? `border-radius:${boxRadius}px !important;` : ""}}
#nl-overlay h1{${headingColor ? `color:${headingColor} !important;` : ""}${fontSize ? `font-size:${fontSize}px !important;` : ""}${fontWeight ? `font-weight:${fontWeight} !important;` : ""}text-transform:${h.textTransform} !important;font-style:${h.fontStyle} !important;}
#nl-overlay .nl-sub{${subColor ? `color:${subColor} !important;` : ""}${subFontSize ? `font-size:${subFontSize}px !important;` : ""}${subFontWeight ? `font-weight:${subFontWeight} !important;` : ""}text-transform:${s.textTransform} !important;font-style:${s.fontStyle} !important;}
#nl-overlay .nl-btn{${btnColor ? `background:${btnColor} !important;` : ""}${btnTextColor ? `color:${btnTextColor} !important;` : ""}${btnFontSize ? `font-size:${btnFontSize}px !important;` : ""}${btnFontWeight ? `font-weight:${btnFontWeight} !important;` : ""}text-transform:${b.textTransform} !important;font-style:${b.fontStyle} !important;${btnRadius ? `border-radius:${btnRadius}px !important;` : ""}}
`;
  return html.replace("</style>", rules + "</style>");
}

export const EMAIL_TEMPLATES = [
  {
    id: "split-offer",
    name: "Split Offer",
    description: "Image left, offer form right",
    icon: "fa-solid fa-gift",
    preview: { bg: "#f5f0e8", accent: "#b9885f" },
    generate: (p) => {
      const { headline = "Upgrade to Free Shipping + 10% Off", bodyCopy = "Sign up with your email to unlock the offer.",
              ctaText = "Get Offer", placeholder = "Email address", image, actionUrl = "", redirectUrl = "", closeUrl = "", domain = "" } = p;
      const bg = nlOverlayBg(p, "rgba(15,23,42,.45)"); const img = image || NL_DEFAULTS.image;
      return `<!DOCTYPE html><html lang="en"><head>${NL_HEAD(headline, domain)}
<style>${NL_BASE}
#nl-box{display:flex;max-width:760px;width:100%;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.3)}
.nl-left{flex:1;min-height:340px;background:url('${img}') center/cover}
.nl-right{flex:1;padding:42px 36px;position:relative}
#nl-overlay h1{font-family:'Poppins',sans-serif;font-size:25px;font-weight:700;color:#1f2937;margin-bottom:10px;line-height:1.3}
.nl-sub{font-size:14px;color:#6b7280;margin-bottom:20px}
.nl-input{width:100%;padding:13px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;font-family:inherit;margin-bottom:12px}
.nl-btn{width:100%;padding:13px;border:none;border-radius:8px;background:#b9885f;color:#fff;font-size:15px;font-weight:600;font-family:'Poppins',sans-serif;cursor:pointer}.nl-btn:hover{filter:brightness(.95)}
.nl-badges{display:flex;gap:20px;margin-top:20px}
.nl-badge{display:flex;align-items:center;gap:8px;font-size:12px;color:#6b7280}.nl-badge i{color:#b9885f;font-size:16px}
.nl-fine{font-size:11px;color:#9ca3af;margin-top:16px}
@media(max-width:640px){.nl-left{display:none}}
</style></head><body>
<div id="nl-overlay" style="background:${bg}">
  <div id="nl-box">
    <div class="nl-left"></div>
    <div class="nl-right">
      <button id="nl-close" class="nl-close"><i class="fa-solid fa-xmark"></i></button>
      <h1>${headline}</h1>
      <p class="nl-sub">${bodyCopy}</p>
      <form id="nl-form">
        <input class="nl-input" type="email" placeholder="${placeholder}" required/>
        <button class="nl-btn" type="submit">${ctaText}</button>
      </form>
      <div class="nl-badges">
        <span class="nl-badge"><i class="fa-solid fa-rotate-left"></i>30-Day Returns</span>
        <span class="nl-badge"><i class="fa-solid fa-shield-halved"></i>1 Year Warranty</span>
      </div>
      <p class="nl-fine">Limited time offer. New subscribers only.</p>
    </div>
  </div>
</div>
${nlScript(actionUrl, redirectUrl, closeUrl)}
</body></html>`;
    }
  },
  {
    id: "bold-discount",
    name: "Bold Discount",
    description: "Dark centered modal",
    icon: "fa-solid fa-percent",
    preview: { bg: "#111827", accent: "#2563eb" },
    generate: (p) => {
      const { headline = "Get 7% Discount", bodyCopy = "Subscribe to our newsletter and get a discount on your first purchase.",
              ctaText = "Subscribe", placeholder = "Your e-mail", actionUrl = "", redirectUrl = "", closeUrl = "", domain = "" } = p;
      const bg = nlOverlayBg(p, "rgba(17,24,39,.85)");
      return `<!DOCTYPE html><html lang="en"><head>${NL_HEAD(headline, domain)}
<style>${NL_BASE}
#nl-box{position:relative;max-width:420px;width:100%;background:#111827;border-radius:6px;padding:44px 40px;text-align:center;color:#fff}
.nl-close{background:rgba(255,255,255,.1);color:#fff}
#nl-overlay h1{font-family:'Poppins',sans-serif;font-size:30px;font-weight:800;margin-bottom:14px}
.nl-sub{font-size:12px;color:#9ca3af;line-height:1.6;margin-bottom:22px;text-transform:uppercase;letter-spacing:.04em}
.nl-input{width:100%;padding:14px;border:none;border-radius:4px;font-size:14px;font-family:inherit;margin-bottom:14px;text-align:center}
.nl-consent{display:flex;gap:8px;font-size:11px;color:#9ca3af;text-align:left;margin-bottom:16px;line-height:1.5}
.nl-btn{width:100%;padding:14px;border:none;border-radius:4px;background:#2563eb;color:#fff;font-size:15px;font-weight:700;font-family:'Poppins',sans-serif;cursor:pointer}.nl-btn:hover{background:#1d4ed8}
</style></head><body>
<div id="nl-overlay" style="background:${bg}">
  <div id="nl-box">
    <button id="nl-close" class="nl-close"><i class="fa-solid fa-xmark"></i></button>
    <h1>${headline}</h1>
    <p class="nl-sub">${bodyCopy}</p>
    <form id="nl-form">
      <input class="nl-input" type="email" placeholder="${placeholder}" required/>
      <label class="nl-consent"><input type="checkbox" required/> I agree to the processing of my personal data in accordance with the GDPR.</label>
      <button class="nl-btn" type="submit">${ctaText}</button>
    </form>
  </div>
</div>
${nlScript(actionUrl, redirectUrl, closeUrl)}
</body></html>`;
    }
  },
  {
    id: "color-panel",
    name: "Color Panel",
    description: "Image + colored panel, bullets",
    icon: "fa-solid fa-list-check",
    preview: { bg: "#d97032", accent: "#ffffff" },
    generate: (p) => {
      const { headline = "Subscribe to our newsletter", bodyCopy = "Updates on our latest collections.",
              ctaText = "Sign me up", placeholder = "Email address", image, actionUrl = "", redirectUrl = "", closeUrl = "", domain = "" } = p;
      const bg = nlOverlayBg(p, "rgba(15,23,42,.5)"); const img = image || NL_DEFAULTS.image;
      return `<!DOCTYPE html><html lang="en"><head>${NL_HEAD(headline, domain)}
<style>${NL_BASE}
#nl-box{display:flex;max-width:740px;width:100%;border-radius:6px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.3)}
.nl-left{flex:1;min-height:360px;background:url('${img}') center/cover}
.nl-right{flex:1.1;background:#d97032;color:#fff;padding:44px 38px;position:relative}
.nl-close{background:rgba(255,255,255,.18);color:#fff}
#nl-overlay h1{font-family:'Poppins',sans-serif;font-size:23px;font-weight:700;margin-bottom:18px;text-transform:uppercase}
.nl-list{list-style:none;margin-bottom:22px}
.nl-list li{display:flex;gap:10px;align-items:flex-start;font-size:13px;margin-bottom:10px;color:rgba(255,255,255,.92)}
.nl-list i{margin-top:3px}
.nl-input{width:100%;padding:13px;border:none;border-radius:4px;font-size:14px;font-family:inherit;margin-bottom:12px}
.nl-consent{display:flex;gap:8px;font-size:11px;color:rgba(255,255,255,.8);margin-bottom:14px;line-height:1.5;text-align:left}
.nl-btn{padding:12px 28px;border:1px solid #fff;border-radius:4px;background:transparent;color:#fff;font-size:14px;font-weight:600;font-family:'Poppins',sans-serif;cursor:pointer}.nl-btn:hover{background:#fff;color:#d97032}
@media(max-width:640px){.nl-left{display:none}}
</style></head><body>
<div id="nl-overlay" style="background:${bg}">
  <div id="nl-box">
    <div class="nl-left"></div>
    <div class="nl-right">
      <button id="nl-close" class="nl-close"><i class="fa-solid fa-xmark"></i></button>
      <h1>${headline}</h1>
      <ul class="nl-list">
        <li><i class="fa-solid fa-check"></i>Personalised offers and promotions</li>
        <li><i class="fa-solid fa-check"></i>Early access to new products</li>
        <li><i class="fa-solid fa-check"></i>${bodyCopy}</li>
      </ul>
      <form id="nl-form">
        <input class="nl-input" type="email" placeholder="${placeholder}" required/>
        <label class="nl-consent"><input type="checkbox" required/> I consent to the processing of my data for marketing.</label>
        <button class="nl-btn" type="submit">${ctaText}</button>
      </form>
    </div>
  </div>
</div>
${nlScript(actionUrl, redirectUrl, closeUrl)}
</body></html>`;
    }
  },
  {
    id: "minimal-center",
    name: "Minimal Center",
    description: "Clean centered card, icon",
    icon: "fa-regular fa-envelope",
    preview: { bg: "#1d4ed8", accent: "#2563eb" },
    generate: (p) => {
      const { headline = "Subscribe to our newsletter", bodyCopy = "Sign up and receive exclusive discounts and promotions.",
              ctaText = "Subscribe", placeholder = "Your email address", actionUrl = "", redirectUrl = "", closeUrl = "", domain = "" } = p;
      const bg = nlOverlayBg(p, "radial-gradient(circle at 30% 20%,#3b82f6,#1e3a8a)");
      return `<!DOCTYPE html><html lang="en"><head>${NL_HEAD(headline, domain)}
<style>${NL_BASE}
#nl-box{position:relative;max-width:440px;width:100%;background:#fff;border-radius:14px;padding:44px 40px;text-align:center;box-shadow:0 30px 70px rgba(0,0,0,.3)}
.nl-icon{width:64px;height:64px;border-radius:50%;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:25px;margin:0 auto 18px}
#nl-overlay h1{font-family:'Poppins',sans-serif;font-size:24px;font-weight:700;color:#1f2937;margin-bottom:8px}
.nl-sub{font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:24px}
.nl-row{display:flex;gap:8px}
.nl-input{flex:1;padding:13px 14px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;font-family:inherit}
.nl-btn{padding:13px 22px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-size:14px;font-weight:600;font-family:'Poppins',sans-serif;cursor:pointer;white-space:nowrap}.nl-btn:hover{background:#1d4ed8}
@media(max-width:480px){.nl-row{flex-direction:column}}
</style></head><body>
<div id="nl-overlay" style="background:${bg}">
  <div id="nl-box">
    <button id="nl-close" class="nl-close"><i class="fa-solid fa-xmark"></i></button>
    <div class="nl-icon"><i class="fa-solid fa-paper-plane"></i></div>
    <h1>${headline}</h1>
    <p class="nl-sub">${bodyCopy}</p>
    <form id="nl-form" class="nl-row">
      <input class="nl-input" type="email" placeholder="${placeholder}" required/>
      <button class="nl-btn" type="submit">${ctaText}</button>
    </form>
  </div>
</div>
${nlScript(actionUrl, redirectUrl, closeUrl)}
</body></html>`;
    }
  },
  {
    id: "offer-center",
    name: "Offer Center",
    description: "Bold offer, claim + skip",
    icon: "fa-solid fa-gift",
    preview: { bg: "#3f6212", accent: "#bef264" },
    generate: (p) => {
      const { headline = "Get 16 Free Meals", bodyCopy = "Don't miss out — plus free shipping on your first box.",
              ctaText = "Claim Offer", placeholder = "Your email address", actionUrl = "", redirectUrl = "", closeUrl = "", domain = "" } = p;
      const bg = nlOverlayBg(p, "rgba(20,40,10,.55)");
      return `<!DOCTYPE html><html lang="en"><head>${NL_HEAD(headline, domain)}
<style>${NL_BASE}
#nl-box{position:relative;max-width:430px;width:100%;background:#3f6212;border-radius:10px;padding:42px 38px;text-align:center;color:#fff}
.nl-close{background:rgba(255,255,255,.15);color:#fff}
.nl-icon{width:56px;height:56px;border-radius:50%;background:#bef264;color:#3f6212;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 16px}
#nl-overlay h1{font-family:'Poppins',sans-serif;font-size:30px;font-weight:800;margin-bottom:8px}
.nl-sub{font-size:14px;color:rgba(255,255,255,.85);margin-bottom:22px}
.nl-label{font-size:12px;font-weight:600;text-align:left;display:block;margin-bottom:6px}
.nl-input{width:100%;padding:13px;border:none;border-radius:6px;font-size:14px;font-family:inherit;margin-bottom:14px}
.nl-btn{width:100%;padding:14px;border:none;border-radius:6px;background:#bef264;color:#3f6212;font-size:15px;font-weight:700;font-family:'Poppins',sans-serif;cursor:pointer}.nl-btn:hover{filter:brightness(.95)}
.nl-skip{display:inline-block;margin-top:14px;color:rgba(255,255,255,.85);font-size:12px;text-decoration:underline;cursor:pointer;background:none;border:none}
</style></head><body>
<div id="nl-overlay" style="background:${bg}">
  <div id="nl-box">
    <button id="nl-close" class="nl-close"><i class="fa-solid fa-xmark"></i></button>
    <div class="nl-icon"><i class="fa-solid fa-gift"></i></div>
    <h1>${headline}</h1>
    <p class="nl-sub">${bodyCopy}</p>
    <form id="nl-form">
      <label class="nl-label">Your email address</label>
      <input class="nl-input" type="email" placeholder="${placeholder}" required/>
      <button class="nl-btn" type="submit">${ctaText}</button>
    </form>
    <button id="nl-skip" class="nl-skip" type="button">Continue without offer</button>
  </div>
</div>
${nlScript(actionUrl, redirectUrl, closeUrl)}
</body></html>`;
    }
  }
];

// ─── DESKTOP LANDING PAGE (device-branching wrapper) ─────────────────────────
// Used by the "Create LP for Desktop" option on the Cookie & Age builders.
//
// The published page becomes a responsive blog-style landing page (the host
// document). The full consent/age-verification experience is embedded as a
// full-screen <iframe> that is ONLY injected for mobile visitors — so:
//   • Desktop  → sees the blog landing page, no consent/age popup.
//   • Mobile   → sees the consent/age page exactly as the default flow.
//
// Device detection uses user-agent + touch + width together, so a desktop
// browser resized to a narrow window is NOT misread as mobile.

export function generateDesktopLPPage({ blog = {}, consentHtml = "", domain = "", mode = "" }) {
  const safeDomain = escapeHtml(domain || "");
  const title    = escapeHtml(blog.title || domain || "Welcome");
  const subtitle = escapeHtml(blog.subtitle || "");
  const img      = escapeHtml(blog.imageUrl || `https://loremflickr.com/1200/600/${encodeURIComponent(domain || "blog")}`);
  const year     = new Date().getFullYear();

  // Split text into multiple <p> on blank lines / newlines (blog bodies are long).
  const toParas = (text) => String(text || "")
    .split(/\n{2,}|\r?\n/).map(t => t.trim()).filter(Boolean)
    .map(t => `<p>${escapeHtml(t)}</p>`).join("\n      ");

  const introHtml = toParas(blog.intro);
  const quoteHtml = blog.quote ? `      <blockquote class="lp-quote">${escapeHtml(blog.quote)}</blockquote>` : "";
  const sections = (Array.isArray(blog.sections) ? blog.sections : [])
    .map((s, i) => {
      const block = `      <h2>${escapeHtml(s.heading || "")}</h2>\n      ${toParas(s.body)}`;
      // Drop the quote in after the first section, like the reference design.
      return (i === 0 && quoteHtml) ? `${block}\n${quoteHtml}` : block;
    })
    .join("\n");

  // Embed the consent/age HTML as a JS string. Escaping "</" prevents the inner
  // </script> tags from prematurely closing our wrapper's <script> block.
  const consentJson = JSON.stringify(consentHtml).replace(/<\//g, "<\\/");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} – ${safeDomain}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Roboto:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Roboto',system-ui,-apple-system,"Segoe UI",Arial,sans-serif;background:#f3f4f6;color:#374151;line-height:1.75;-webkit-font-smoothing:antialiased;padding:40px 16px}
.lp-card{max-width:880px;margin:0 auto;background:#fff;border-radius:28px;padding:48px 56px 52px;box-shadow:0 10px 40px rgba(15,23,42,.06)}
.lp-title{font-family:'Poppins',sans-serif;font-size:26px;font-weight:700;line-height:1.32;color:#1f2937;margin-bottom:24px}
.lp-hero{width:100%;height:auto;max-height:420px;object-fit:cover;border-radius:14px;display:block;margin-bottom:32px}
.lp-lead{font-size:18px;color:#6b7280;margin-bottom:22px}
.lp-card p{font-size:16px;color:#4b5563;margin-bottom:18px}
.lp-card h2{font-family:'Poppins',sans-serif;font-size:22px;font-weight:600;color:#1f2937;margin:34px 0 14px}
.lp-quote{background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 10px 10px 0;padding:18px 24px;margin:28px 0;font-style:italic;color:#475569;font-size:16px}
.lp-foot{margin-top:42px;padding-top:22px;border-top:1px solid #eef2f7;font-size:13px;color:#9ca3af}
@media(max-width:640px){.lp-card{padding:28px 22px 34px;border-radius:20px}.lp-title{font-size:22px}.lp-card h2{font-size:19px}.lp-lead{font-size:16px}}
</style>
</head>
<body>
  <article class="lp-card">
    <h1 class="lp-title">${title}</h1>
    <img class="lp-hero" src="${img}" alt="${title}"/>
    ${subtitle ? `<p class="lp-lead">${subtitle}</p>` : ""}
    ${introHtml}
${sections}
    <div class="lp-foot">&copy; ${year} ${safeDomain || "Brand"}. All rights reserved.</div>
  </article>
<script>
(function(){
  var consentHtml = ${consentJson};
  var ua = navigator.userAgent || "";
  var uaMobile = /Mobi|Android|iPhone|iPod|iPad|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  // Forced mode (builder preview toggle) wins; then ?view=mobile|desktop in the
  // URL; otherwise device detection: mobile when the user-agent is a mobile
  // device OR the viewport is phone-sized (<=767px). This reliably shows the
  // consent/age popup on phones and in device emulators.
  var MODE = ${JSON.stringify(mode || "")};
  var forced = MODE || (location.search.match(/[?&]view=(mobile|desktop)/i) || [])[1] || "";
  function isMobile(){
    if (forced) return forced.toLowerCase() === "mobile";
    return uaMobile || (window.innerWidth || document.documentElement.clientWidth || 0) <= 767;
  }
  function apply(){
    var existing = document.getElementById("__consent_frame");
    if (isMobile()) {
      if (existing) return;
      var f = document.createElement("iframe");
      f.id = "__consent_frame";
      f.title = "Notice";
      f.setAttribute("aria-label", "Notice");
      f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:none;z-index:2147483647;background:#fff";
      f.srcdoc = consentHtml;
      document.body.appendChild(f);
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else if (existing) {
      existing.remove();
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
  }
  apply();
  // React to live resizing across the phone/desktop breakpoint (no reload).
  if (!forced) window.addEventListener("resize", apply);
})();
</script>
</body>
</html>`;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export const TEMPLATES_BY_TYPE = {
  cookie: COOKIE_TEMPLATES,
  "age-verification": AGE_TEMPLATES,
  newsletter: EMAIL_TEMPLATES
};

export function getTemplate(type, id) {
  return TEMPLATES_BY_TYPE[type]?.find(t => t.id === id);
}
