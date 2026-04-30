import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { keyword } = await req.json();
  if (!keyword) {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `キーワード「${keyword}」について以下のJSONを返してください。

iconsについて:
- 「直接的な意味」だけでなく「場所・建物・環境・行為・周辺要素」など多角的に連想してください
- 例：「図書館」→ 本・棚・建物・入口・静けさ・読書・カード・検索・司書・閲覧席
- Lucideライブラリの実在するkebab-case英語名のみ使用

relatedについて:
- 派生・関連・対比ワードを6個（日本語5文字以内）

JSONのみ返答（説明・コードブロック不要）:
{
  "icons": [{"label":"日本語5文字以内","icon":"lucide-icon-name"},...10個],
  "related": ["ワード1","ワード2",...6個]
}`,
      },
    ],
  });

  const text =
    message.content?.map((b) => ("text" in b ? b.text : "")).join("") ?? "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) {
    return NextResponse.json({ error: "解析失敗" }, { status: 500 });
  }

  const parsed = JSON.parse(m[0]);

  const iconResults = await Promise.all(
    (parsed.icons ?? []).map(
      async (item: { label: string; icon: string }) => {
        try {
          const r = await fetch(
            `https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/${item.icon}.svg`
          );
          if (!r.ok) return null;
          const svg = await r.text();
          return { label: item.label, icon: item.icon, svg };
        } catch {
          return null;
        }
      }
    )
  );

  return NextResponse.json({
    icons: iconResults.filter(Boolean),
    related: parsed.related ?? [],
  });
}
