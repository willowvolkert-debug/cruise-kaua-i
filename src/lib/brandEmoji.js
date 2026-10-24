// Brand emoji theme.
// To go back to the standard emojis, set USE_BRAND_EMOJIS to false. Nothing else needs to change.
export const USE_BRAND_EMOJIS = true;

// Standard emoji -> emoji that matches the Cruise truck / island logo
export const BRAND_EMOJI_MAP = {
  "🌿": "🌴",
  "🌱": "🌴",
  "🌋": "🏝️",
  "🌊": "🏄",
};

const pattern = new RegExp(Object.keys(BRAND_EMOJI_MAP).join("|"), "g");

export function brandifyText(text) {
  return text.replace(pattern, (m) => BRAND_EMOJI_MAP[m]);
}

export function startBrandEmoji() {
  if (!USE_BRAND_EMOJIS || typeof document === "undefined") return;
  const skip = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT"]);
  const swap = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (skip.has(node.parentElement?.tagName)) continue;
      const next = brandifyText(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
  };
  swap(document.body);
  new MutationObserver((muts) => {
    muts.forEach((m) => {
      if (m.type === "characterData") {
        const next = brandifyText(m.target.nodeValue);
        if (next !== m.target.nodeValue) m.target.nodeValue = next;
      } else m.addedNodes.forEach((n) => swap(n));
    });
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}