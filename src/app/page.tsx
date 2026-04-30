"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";

const PALETTE = [
  "#1a1a1a",
  "#185FA5",
  "#c0392b",
  "#2b9a66",
  "#e67700",
  "#7048e8",
  "#555",
];
const HISTORY_KEY = "pictogrammer_history";

const SEED_WORDS = [
  "旅行","音楽","料理","自然","スポーツ","映画","読書","動物","海","山",
  "祭り","花火","温泉","夜景","カフェ","図書館","病院","学校","駅","空港",
  "春","夏","秋","冬","朝","夜","雨","風","雪","星",
  "犬","猫","鳥","魚","花","木","空","海","川","森",
];

function getInitialRelated(): string[] {
  const shuffled = [...SEED_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
}

interface Icon {
  label: string;
  icon?: string;
  svg: string;
  isAlphaSvg?: boolean;
  fillStyle?: string;
}

interface CacheEntry {
  icons: Icon[];
  related: string[];
  mode: string;
}

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(query: string, prev: string[]): string[] {
  const next = [query, ...prev.filter((h) => h !== query)].slice(0, 10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

function isSingleAlpha(str: string): boolean {
  return /^[a-zA-Z]{1,2}$/.test(str.trim());
}

const S: Record<string, CSSProperties | ((...args: unknown[]) => CSSProperties)> = {
  page: {
    background: "#f2f3f5",
    minHeight: "100vh",
    padding: "1.5rem 1rem 3rem",
    fontFamily: "system-ui,sans-serif",
  },
  wrap: { maxWidth: 800, margin: "0 auto" },
  hdr: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: "1.5rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid rgba(0,0,0,0.1)",
  },
  titleWrap: { display: "flex", flexDirection: "column", gap: 1 },
  titleJa: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1a1a1a",
    letterSpacing: ".02em",
  },
  titleEn: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "#aaa",
    letterSpacing: ".12em",
  },
  box: {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
    padding: "1rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    marginBottom: ".875rem",
  },
  input: {
    width: "100%",
    height: 44,
    padding: "0 40px 0 14px",
    background: "#f0f2f5",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 9,
    fontSize: 14,
    color: "#1a1a1a",
    outline: "none",
    boxSizing: "border-box",
  },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: ".625rem" },
  tagLabel: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "#bbb",
    letterSpacing: ".1em",
    marginBottom: 3,
  },
  historyTag: {
    padding: "4px 10px",
    background: "#f0f2f5",
    color: "#666",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 20,
    fontSize: 11,
    cursor: "pointer",
  },
  relatedTag: {
    padding: "4px 10px",
    background: "#eef4fc",
    color: "#185FA5",
    border: "1px solid rgba(24,95,165,0.2)",
    borderRadius: 20,
    fontSize: 11,
    cursor: "pointer",
  },
  alphaTag: {
    padding: "4px 10px",
    background: "#f5f0ff",
    color: "#7048e8",
    border: "1px solid rgba(112,72,232,0.2)",
    borderRadius: 20,
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "monospace",
    fontWeight: 500,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "1rem 0 .75rem",
  },
  count: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "#888",
    letterSpacing: ".1em",
  },
  retry: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 11px",
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 7,
    color: "#888",
    fontSize: 11,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    gap: 8,
  },
  lbl: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "#aaa",
    marginTop: 8,
    textAlign: "center",
    maxWidth: "90%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(255,255,255,0.95)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  dlBtn: {
    padding: "5px 14px",
    background: "#185FA5",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
  },
};

function genBtn(off: boolean): CSSProperties {
  return {
    height: 44,
    padding: "0 20px",
    background: off ? "#aaa" : "#185FA5",
    color: "#fff",
    border: "none",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 500,
    cursor: off ? "default" : "pointer",
    whiteSpace: "nowrap",
  };
}

function skStyle(i: number): CSSProperties {
  return {
    aspectRatio: "1",
    background: "#e8eaed",
    borderRadius: 12,
    animationDelay: i * 0.06 + "s",
    animation: "pulse 1.2s ease-in-out infinite",
  };
}

function cardStyle(hov: boolean): CSSProperties {
  return {
    aspectRatio: "1",
    background: "#fff",
    border: `1px solid ${hov ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.07)"}`,
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    padding: 12,
    transition: "all .15s",
    boxShadow: hov
      ? "0 3px 12px rgba(0,0,0,0.1)"
      : "0 1px 3px rgba(0,0,0,0.04)",
    boxSizing: "border-box",
  };
}

function cpBtnStyle(done: boolean): CSSProperties {
  return {
    padding: "4px 14px",
    background: "none",
    color: done ? "#2b9a66" : "#888",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 6,
    fontSize: 11,
    cursor: "pointer",
  };
}

function applyColor(
  svg: string,
  isAlphaSvg: boolean | undefined,
  color: string
): string {
  if (isAlphaSvg) {
    return svg.split("FRAMECOLOR").join(color);
  }
  return svg
    .replace(/stroke="currentColor"/g, `stroke="${color}"`)
    .replace(/fill="currentColor"/g, `fill="${color}"`);
}

function DlBtn({ label, onClick }: { label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {hov && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          ダウンロード
        </div>
      )}
      <button
        style={{
          padding: "6px 14px",
          background: "#185FA5",
          color: "#fff",
          border: "none",
          borderRadius: 7,
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          minWidth: 52,
        }}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  );
}

interface IconCardProps {
  icon: Icon;
  color: string;
  copied: boolean;
  onDownloadSVG: () => void;
  onDownloadPNG: () => void;
  onCopyPNG: () => void;
}

function IconCard({ icon, color, copied, onDownloadSVG, onDownloadPNG, onCopyPNG }: IconCardProps) {
  const [hov, setHov] = useState(false);
  const processed = applyColor(icon.svg, icon.isAlphaSvg, color);
  const sized = icon.isAlphaSvg
    ? processed.replace("<svg", '<svg width="64" height="64"')
    : processed
        .replace(/width="\d+"/, 'width="56"')
        .replace(/height="\d+"/, 'height="56"');

  return (
    <div
      style={cardStyle(hov)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div dangerouslySetInnerHTML={{ __html: sized }} />
      <div style={S.lbl as CSSProperties}>{icon.label}</div>
      {hov && (
        <div style={S.overlay as CSSProperties}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <DlBtn label="SVG" onClick={onDownloadSVG} />
            <DlBtn label="PNG" onClick={onDownloadPNG} />
          </div>
          <button style={cpBtnStyle(copied)} onClick={onCopyPNG}>
            {copied ? "コピー済み" : "PNGコピー"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PictogramGen() {
  const [query, setQuery] = useState("");
  const [icons, setIcons] = useState<Icon[]>([]);
  const [related, setRelated] = useState<string[]>(getInitialRelated);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [color, setColor] = useState("#1a1a1a");
  const [copied, setCopied] = useState<number | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [mode, setMode] = useState<"lucide" | "alpha" | "">("");
  const inputRef = useRef<HTMLInputElement>(null);
  const iconCache = useRef(new Map<string, CacheEntry>());

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  async function generate(q?: string, useCache = false) {
    const target = (q ?? query).trim();
    if (!target || loading) return;

    if (useCache && iconCache.current.has(target)) {
      const cached = iconCache.current.get(target)!;
      setQuery(target);
      setIcons(cached.icons);
      setRelated(cached.related);
      setLastQuery(target);
      setMode(cached.mode as "lucide" | "alpha" | "");
      return;
    }

    setLoading(true);
    setError("");
    setIcons([]);
    setRelated([]);
    setLastQuery(target);
    setHistory((prev) => saveHistory(target, prev));

    const isAlpha = isSingleAlpha(target);
    setMode(isAlpha ? "alpha" : "lucide");

    try {
      let resultIcons: Icon[] = [];
      let resultRelated: string[] = [];

      if (isAlpha) {
        const res = await fetch("/api/generate-alpha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ letter: target }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "生成失敗");
        resultIcons = data.icons ?? [];
      } else {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: target }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "生成失敗");
        resultIcons = data.icons ?? [];
        resultRelated = data.related ?? [];
        setRelated(resultRelated);
      }

      if (!resultIcons.length) throw new Error("アイコンの取得に失敗しました");
      setIcons(resultIcons);

      iconCache.current.set(target, {
        icons: resultIcons,
        related: resultRelated,
        mode: isAlpha ? "alpha" : "lucide",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    }

    setLoading(false);
  }

  function downloadSVG(icon: Icon) {
    const blob = new Blob([applyColor(icon.svg, icon.isAlphaSvg, color)], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = icon.label + ".svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPNG(icon: Icon) {
    const svgStr = applyColor(icon.svg, icon.isAlphaSvg, color);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = icon.label + ".png";
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function copyPNG(icon: Icon, i: number) {
    const svgStr = applyColor(icon.svg, icon.isAlphaSvg, color);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob(async (pngBlob) => {
        if (!pngBlob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob }),
        ]);
        setCopied(i);
        setTimeout(() => setCopied(null), 1500);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) generate();
  }

  const showTags = true;
  const isAlphaMode = mode === "alpha";

  return (
    <div style={S.page as CSSProperties}>
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}`}</style>
      <div style={S.wrap as CSSProperties}>
        {/* Header */}
        <div style={S.hdr as CSSProperties}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 3,
              width: 28,
              height: 28,
            }}
          >
            {[0.9, 0.4, 0.4, 0.9].map((o, i) => (
              <div
                key={i}
                style={{
                  background: `rgba(24,95,165,${o})`,
                  borderRadius: 4,
                }}
              />
            ))}
          </div>
          <div style={S.titleWrap as CSSProperties}>
            <span style={S.titleJa as CSSProperties}>ピクトグラマー</span>
            <span style={S.titleEn as CSSProperties}>pictogrammer</span>
          </div>
        </div>

        {/* Search */}
        <div style={S.box as CSSProperties}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                ref={inputRef}
                style={S.input as CSSProperties}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="キーワード or 1〜2文字アルファベット（A〜ZZ）"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    fontSize: 17,
                    color: "#aaa",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              )}
            </div>
            <button
              style={genBtn(loading || !query.trim())}
              disabled={loading || !query.trim()}
              onClick={() => generate()}
            >
              {loading ? "生成中..." : "生成"}
            </button>
          </div>

          {/* 関連ワード・履歴 */}
          {showTags && (
            <div
              style={{
                marginTop: ".875rem",
                display: "flex",
                flexDirection: "column",
                gap: ".75rem",
              }}
            >
              <div>
                <div style={S.tagLabel as CSSProperties}>関連ワード</div>
                <div style={{ ...(S.tagRow as CSSProperties), minHeight: 26 }}>
                  {related.map((r) => (
                    <button
                      key={r}
                      style={S.relatedTag as CSSProperties}
                      onClick={() => {
                        setQuery(r);
                        generate(r);
                      }}
                    >
                      + {r}
                    </button>
                  ))}
                </div>
              </div>
              {history.length > 0 && (
                <div>
                  <div
                    style={{
                      ...(S.tagLabel as CSSProperties),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>検索履歴</span>
                    <button
                      onClick={clearHistory}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 10,
                        color: "#ccc",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      クリア
                    </button>
                  </div>
                  <div style={S.tagRow as CSSProperties}>
                    {history.map((h) => (
                      <button
                        key={h}
                        style={S.historyTag as CSSProperties}
                        onClick={() => {
                          setQuery(h);
                          generate(h, true);
                        }}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Color + やり直す */}
        {(icons.length > 0 || loading) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: ".875rem",
            }}
          >
            {icons.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 10,
                  padding: ".45rem .75rem",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    color: "#aaa",
                    letterSpacing: ".15em",
                    marginRight: 2,
                  }}
                >
                  COLOR
                </span>
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: c,
                      border: `2.5px solid ${color === c ? "#1a1a1a" : "transparent"}`,
                      cursor: "pointer",
                      outline: "none",
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "2px solid #ddd",
                    padding: 0,
                    cursor: "pointer",
                  }}
                />
              </div>
            )}
            <button
              style={S.retry as CSSProperties}
              disabled={loading}
              onClick={() => generate(lastQuery)}
            >
              ↺ やり直す
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: ".875rem",
              background: "#fff3f3",
              border: "1px solid #ffccc7",
              borderRadius: 9,
              fontSize: 12,
              color: "#c0392b",
              marginBottom: ".875rem",
            }}
          >
            エラー: {error}
          </div>
        )}

        {loading && (
          <div style={S.grid as CSSProperties}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={skStyle(i)} />
            ))}
          </div>
        )}

        {!loading && icons.length > 0 && (
          <div style={S.grid as CSSProperties}>
            {icons.map((icon, i) => (
              <IconCard
                key={i}
                icon={icon}
                color={color}
                copied={copied === i}
                onDownloadSVG={() => downloadSVG(icon)}
                onDownloadPNG={() => downloadPNG(icon)}
                onCopyPNG={() => copyPNG(icon, i)}
              />
            ))}
          </div>
        )}

        {!loading && icons.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "3.5rem 0" }}>
            <svg
              width="44"
              height="44"
              viewBox="0 0 48 48"
              fill="none"
              style={{ opacity: 0.2, marginBottom: ".875rem" }}
            >
              <rect
                x="6"
                y="6"
                width="14"
                height="14"
                rx="3"
                stroke="#888"
                strokeWidth="2"
              />
              <rect
                x="28"
                y="6"
                width="14"
                height="14"
                rx="3"
                stroke="#888"
                strokeWidth="2"
              />
              <rect
                x="6"
                y="28"
                width="14"
                height="14"
                rx="3"
                stroke="#888"
                strokeWidth="2"
              />
              <rect
                x="28"
                y="28"
                width="14"
                height="14"
                rx="3"
                stroke="#888"
                strokeWidth="2"
              />
            </svg>
            <p style={{ fontSize: 13, color: "#bbb" }}>
              キーワードを入力して生成ボタンを押してください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
