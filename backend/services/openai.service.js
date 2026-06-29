const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Returns structured JSON: { headline, bodyCopy, ctaText, imagePrompt }
async function generatePageContent({ domain, type, templateName, extra = {} }) {
  const typeLabels = {
    cookie: "GDPR cookie consent banner",
    "age-verification": "age verification gate",
    newsletter: "email newsletter"
  };

  const fullDesign = type === "cookie" && extra.fullDesign;
  const referenceImage = extra.referenceImage; // supported for any type now

  const designSchema = `{
  "headline": "short punchy headline (max 8 words)",
  "bodyCopy": "1-2 sentence body text explaining the cookie consent purpose, clear and friendly",
  "acceptText": "accept button text (1-3 words)",
  "declineText": "decline button text (1-3 words)",
  "icon": "pick ONE of: shield, lock, sparkles, bell, leaf, heart, globe, key, eye, info, chart, star",
  "accentColor": "pick ONE hex code of: #6366f1, #10b981, #f43f5e, #f59e0b, #0ea5e9, #8b5cf6, #14b8a6, #f97316",
  "animation": "pick ONE of: fade-scale, slide-up, slide-down, zoom"
}`;

  // Vision path: analyze a reference screenshot and replicate its style/copy as closely as possible.
  if (referenceImage) {
    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: fullDesign
                ? `You are a senior UI designer. Look at the attached cookie-consent popup screenshot and replicate its style as closely as possible for the website/brand "${domain}". Match the icon style, dominant color palette, and tone/wording of the copy visible in the image as closely as the constraints below allow.

Return ONLY a JSON object with these exact keys:
${designSchema}`
                : `You are a senior UI designer. Look at the attached ${typeLabels[type] || type} screenshot and REPLICATE its visual design as closely as possible for the website/brand "${domain}". Carefully match: the dominant page background colour, the card/box background colour, the heading text colour, the sub-content text colour, both button background colours and their text colours, and the font weights used.${extra.minAge ? ` Minimum age requirement: ${extra.minAge}+.` : ""} Also write fitting copy in the same tone.

Return ONLY a JSON object with these exact keys. Colours MUST be hex (e.g. #1e293b). Weights MUST be one of 400, 500, 600, 700, 800:
{
  "headline": "heading text (max 10 words)",
  "bodyCopy": "1-2 sentence sub-content",
  "ctaText": "confirm button text (2-4 words)",
  "exitText": "exit button text (1-2 words)",
  "bgColor": "page background hex",
  "boxColor": "card/box background hex",
  "headingColor": "heading text hex",
  "subColor": "sub-content text hex",
  "confirmColor": "confirm button background hex",
  "confirmTextColor": "confirm button text hex",
  "exitColor": "exit button background hex",
  "exitTextColor": "exit button text hex",
  "headingWeight": "one of 400-800",
  "bodyWeight": "one of 400-800",
  "buttonWeight": "one of 400-800"
}`
            },
            { type: "image_url", image_url: { url: referenceImage } }
          ]
        }],
        temperature: 0.5,
        max_tokens: 400,
        response_format: { type: "json_object" }
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      console.warn("AI design (vision) failed, using fallback:", e.message);
      return fallbackPageContent({ domain, type, fullDesign, extra });
    }
  }

  const prompt = fullDesign
    ? `You are a senior UI designer and copywriter creating a complete, original cookie-consent popup design for the website/brand: "${domain}".

Write the copy AND choose the visual style. Be creative and vary your choice — do not default to a cookie icon every time; pick whatever icon best fits the brand's vibe.

Return ONLY a JSON object with these exact keys:
${designSchema}`
    : `You are a professional copywriter for SaaS products.
Generate copy for a ${typeLabels[type] || type} for the website/brand: "${domain}".
Template style: ${templateName}.
${extra.minAge ? `Minimum age requirement: ${extra.minAge}+` : ""}
${extra.topic ? `Newsletter topic: ${extra.topic}` : ""}

Return ONLY a JSON object with these exact keys:
{
  "headline": "short punchy headline (max 10 words)",
  "bodyCopy": "2-3 sentence body text explaining the purpose",
  "ctaText": "call-to-action button text (2-4 words)",
  "imagePrompt": "a prompt for an AI image generator to create a fitting hero/background image (1 sentence)"
}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.75,
      max_tokens: 400,
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (e) {
    // No OpenAI key / no internet / quota — return sensible defaults so the
    // builder keeps working offline.
    console.warn("AI generation failed, using fallback:", e.message);
    return fallbackPageContent({ domain, type, fullDesign, extra });
  }
}

// Offline / no-key fallback for generatePageContent — mirrors the JSON shape
// each path returns so the front-end works exactly the same.
function fallbackPageContent({ domain, type, fullDesign, extra = {} }) {
  const brand = domain || "your site";
  if (fullDesign) {
    return {
      headline: "We value your privacy",
      bodyCopy: `${brand} uses cookies to improve your experience, analyze traffic, and personalize content. Accept to continue, or decline non-essential cookies.`,
      acceptText: "Accept All",
      declineText: "Decline",
      icon: "shield",
      accentColor: "#6366f1",
      animation: "fade-scale"
    };
  }
  if (type === "age-verification") {
    const minAge = extra.minAge || 18;
    return {
      headline: "Age Verification Required",
      bodyCopy: `This website contains content intended for adults. You must be ${minAge} or older to enter. Please confirm your date of birth to continue.`,
      ctaText: "Enter Site",
      imagePrompt: `A tasteful, modern hero background suggesting a secure, adults-only entrance for ${brand}.`
    };
  }
  if (type === "newsletter") {
    return {
      headline: `Stay in the loop with ${brand}`,
      bodyCopy: `Subscribe to the ${brand} newsletter for the latest updates, tips, and exclusive offers delivered straight to your inbox.`,
      ctaText: "Subscribe",
      imagePrompt: `A bright, friendly hero image representing a newsletter signup for ${brand}.`
    };
  }
  return {
    headline: "We Use Cookies",
    bodyCopy: `${brand} uses cookies to improve your browsing experience and analyze site traffic. By clicking "Accept", you consent to our use of cookies.`,
    ctaText: "Accept",
    imagePrompt: `A clean, modern hero background for a cookie consent notice on ${brand}.`
  };
}

// Generic blog-style landing page content (used for the "Create LP for Desktop"
// feature). Reuses the same OpenAI client as everything else.
async function generateBlogContent({ domain, industry }) {
  const industryLine = industry
    ? `The article must be relevant to the "${industry}" industry — write the topic, headings and copy so they clearly fit that industry.`
    : `Keep it generic, brand-safe and topic-neutral.`;

  const prompt = `You are a professional blog writer and SEO content specialist. Write a complete, original, engaging blog article for the website/brand "${domain}".
${industryLine}

Requirements:
- Total length MUST be approximately 800-1000 words (intro + all section bodies combined).
- Write 5 to 7 sections. Each section has a heading and 2-3 full paragraphs of real, substantive content (no filler, no placeholder text).
- Separate paragraphs within a section's body using a blank line.
- Natural, reader-friendly, informative tone.

Return ONLY a JSON object with these exact keys:
{
  "title": "compelling blog post title (max 12 words)",
  "subtitle": "one-sentence deck / subtitle",
  "intro": "engaging opening, 2-3 sentences",
  "quote": "one short, memorable pull-quote sentence relevant to the topic",
  "sections": [ { "heading": "section heading (max 8 words)", "body": "2-3 full paragraphs separated by blank lines" } ],
  "imageKeyword": "2-3 words describing the ideal stock photo for this article's niche"
}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 2400,
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (e) {
    // No OpenAI key / quota / network — fall back to generic content so the
    // desktop landing page still generates (important for internal use).
    console.warn("Blog AI generation failed, using fallback:", e.message);
    return fallbackBlog(domain, industry);
  }
}

function fallbackBlog(domain, industry) {
  const ind = (industry || "").trim() || "your industry";
  const cap = ind.charAt(0).toUpperCase() + ind.slice(1);
  const p = (...arr) => arr.join("\n\n");
  return {
    title: `${cap} insights and trends from ${domain}`,
    subtitle: `Practical tips, current trends, and real stories from the world of ${ind}.`,
    intro: `Welcome to ${domain}, your trusted source for everything ${ind}. In this article we explore the ideas, tools, and trends shaping the field today, and share practical guidance you can actually use.`,
    quote: `Success in ${ind} comes from consistent, curious effort — one small step at a time.`,
    sections: [
      { heading: `Why ${ind} matters today`, body: p(
        `${cap} has moved from a niche interest to something that touches almost every part of modern life and work. As expectations rise and technology accelerates, understanding the fundamentals is no longer optional — it is a genuine advantage.`,
        `Staying current means you can spot opportunities earlier, avoid common pitfalls, and make decisions with confidence. Throughout this guide we focus on what is changing, why it matters, and how you can respond.`) },
      { heading: "Getting started the right way", body: p(
        `If you are new to ${ind}, the sheer amount of information can feel overwhelming. The good news is that a small set of core principles carries you most of the way. Start by getting comfortable with the basics before chasing advanced tactics.`,
        `Set clear goals, measure what matters, and iterate. Progress in ${ind} comes from consistent, deliberate steps rather than dramatic overnight changes.`) },
      { heading: "Common mistakes to avoid", body: p(
        `Even experienced people fall into predictable traps: copying others without understanding context, ignoring the data, or scaling too fast before the fundamentals are solid. Each of these can quietly undermine otherwise good work.`,
        `The fix is usually simple — slow down, validate assumptions, and build on what genuinely works for your situation rather than what is merely popular.`) },
      { heading: "Tools and best practices", body: p(
        `The right tools save time and reduce friction, but tools alone are not a strategy. Choose solutions that fit your workflow, learn them well, and resist the urge to constantly switch.`,
        `Pair good tooling with strong habits: document your process, review results regularly, and keep learning. In ${ind}, the practitioners who compound small improvements tend to come out ahead.`) },
      { heading: `The future of ${ind}`, body: p(
        `The landscape keeps evolving, and the pace shows no signs of slowing. New approaches, expectations, and technologies will continue to reshape how things are done.`,
        `By staying curious and grounded in fundamentals, you can adapt to whatever comes next. Follow along with ${domain} for fresh insights, practical tips, and the trends shaping ${ind} in the months ahead.`) }
    ],
    imageKeyword: ind === "your industry" ? domain : ind
  };
}

module.exports = { generatePageContent, generateBlogContent };
