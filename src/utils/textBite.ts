/** スライム等がテキストを1文字ずつ食べる演出用ユーティリティ */

export interface BiteChar {
  el: HTMLElement;
  x: number;
  y: number;
  bites: number;
}

export const SLIME_BITE_RADIUS = 34;
export const SLIME_RESTORE_RADIUS = 58;
/** 1文字＝1回の食べ判定で消える */
export const BITES_PER_CHAR = 1;

export function wrapTextNodeChars(el: HTMLElement) {
  if (el.dataset.biteWrapped === "1") return;

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const value = node.textContent ?? "";
      return value.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const text = textNode.textContent ?? "";
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      const span = document.createElement("span");
      span.dataset.biteChar = "1";
      span.textContent = ch === " " ? "\u00A0" : ch;
      span.style.display = "inline-block";
      span.style.transition = "opacity 0.14s ease, transform 0.14s ease";
      span.style.transformOrigin = "center bottom";
      frag.appendChild(span);
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  });

  el.dataset.biteWrapped = "1";
}

export function prepareBiteTargets(root: ParentNode = document) {
  root.querySelectorAll("[data-wanderer-bite]").forEach((node) => {
    node.querySelectorAll("h1, h2, p, span[data-slime-bite]").forEach((el) => {
      wrapTextNodeChars(el as HTMLElement);
    });
  });
}

export function restoreBiteTargets(root: ParentNode = document) {
  root.querySelectorAll("[data-bite-char]").forEach((node) => {
    const span = node as HTMLElement;
    span.style.opacity = "1";
    span.style.transform = "scale(1)";
    span.style.clipPath = "";
  });
}

export function applyBiteVisual(ch: BiteChar) {
  const t = ch.bites / BITES_PER_CHAR;
  if (t <= 0) {
    ch.el.style.opacity = "1";
    ch.el.style.transform = "scale(1)";
    ch.el.style.clipPath = "";
    return;
  }
  if (t >= 1) {
    ch.el.style.opacity = "0";
    ch.el.style.transform = "scale(0.1) translateY(8px)";
    ch.el.style.clipPath = "";
    return;
  }
  const remain = 1 - t;
  ch.el.style.opacity = String(0.25 + remain * 0.75);
  ch.el.style.transform = `scale(${0.15 + remain * 0.85})`;
}

export function measureBiteChars(): BiteChar[] {
  prepareBiteTargets();
  const chars: BiteChar[] = [];

  document.querySelectorAll("[data-bite-char]").forEach((node) => {
    const el = node as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (rect.width < 0.5 && rect.height < 0.5) return;
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    if (rect.right < 0 || rect.left > window.innerWidth) return;
    chars.push({
      el,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      bites: 0,
    });
  });

  return chars;
}

export function refreshBiteCharPositions(chars: BiteChar[]) {
  for (const ch of chars) {
    if (!ch.el.isConnected) continue;
    const rect = ch.el.getBoundingClientRect();
    if (rect.width < 0.5 && rect.height < 0.5) continue;
    ch.x = rect.left + rect.width / 2;
    ch.y = rect.top + rect.height / 2;
  }
}

export const MUNCH_TICKS = 8;
export const EAT_COOLDOWN_TICKS = 10;

export interface SlimeBiteActor {
  x: number;
  y: number;
  eatCooldown: number;
  phase: string;
  munchTicks: number;
  munchPhase: number;
}

function nearestEdibleChar(
  sx: number,
  sy: number,
  chars: BiteChar[],
  slimeRadius: number
): BiteChar | null {
  let target: BiteChar | null = null;
  let targetDist = Infinity;

  for (const ch of chars) {
    if (ch.bites >= BITES_PER_CHAR) continue;
    const edgeDist = Math.hypot(sx - ch.x, sy - ch.y) - slimeRadius;
    if (edgeDist < SLIME_BITE_RADIUS && edgeDist < targetDist) {
      targetDist = edgeDist;
      target = ch;
    }
  }

  return target;
}

export function updateBiteCharsFromSlimes(
  chars: BiteChar[],
  slimes: SlimeBiteActor[],
  slimeRadius = 11
) {
  if (chars.length === 0) return;

  for (const slime of slimes) {
    if (slime.phase !== "wander") continue;

    const sx = (slime.x / 100) * window.innerWidth;
    const sy = (slime.y / 100) * window.innerHeight;

    if (slime.munchTicks > 0) {
      slime.munchPhase += 1;
      slime.munchTicks -= 1;
      if (slime.munchTicks === 0) {
        const target = nearestEdibleChar(sx, sy, chars, slimeRadius);
        if (target) {
          target.bites = Math.min(BITES_PER_CHAR, target.bites + 1);
        }
        slime.eatCooldown = EAT_COOLDOWN_TICKS;
      }
      continue;
    }

    if (slime.eatCooldown > 0) continue;

    const target = nearestEdibleChar(sx, sy, chars, slimeRadius);
    if (target) {
      slime.munchTicks = MUNCH_TICKS;
      slime.munchPhase = 0;
    }
  }

  for (const ch of chars) {
    let nearest = Infinity;
    for (const slime of slimes) {
      if (slime.phase !== "wander") continue;
      const sx = (slime.x / 100) * window.innerWidth;
      const sy = (slime.y / 100) * window.innerHeight;
      nearest = Math.min(
        nearest,
        Math.hypot(sx - ch.x, sy - ch.y) - slimeRadius
      );
    }
    if (nearest > SLIME_RESTORE_RADIUS && ch.bites > 0) {
      ch.bites = 0;
    }
    applyBiteVisual(ch);
  }
}
