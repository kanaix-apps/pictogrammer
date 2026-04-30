import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { letter } = await req.json();
  if (!letter) {
    return NextResponse.json({ error: "letter is required" }, { status: 400 });
  }

  const L = letter.toUpperCase();
  // 文字数に応じてフォントサイズを決定（コード側で制御）
  const fontSize = L.length === 1 ? 42 : 30;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    messages: [
      {
        role: "user",
        content: `viewBox="0 0 100 100" のSVGキャンバスに、文字を中央に表示するためのデコレーションフレームを10種類生成してください。

【絶対に守ること】
- 文字・テキストは一切描画しない。フレームと背景の図形のみ生成する。
- 色は必ず FRAMECOLOR というプレースホルダーのみ使う（#000・#1a1a1a 等は使わない）
- white はそのまま white と書いてよい
- stroke-width は 5〜7 に統一する
- フレームはキャンバスの端に配置し、中央 40×40 の領域（x:30〜70, y:30〜70）を空けること
- filled スタイルでは、塗りつぶし図形の上に文字が白で乗るため、図形が中央を完全に覆ってOK

【3スタイルを配分して10個生成】
スタイルA: outline（4個）
  フレームのみ: fill="none" stroke="FRAMECOLOR" stroke-width="6"
  textColor: "FRAMECOLOR"

スタイルB: filled（3個）
  塗りつぶし図形: fill="FRAMECOLOR" stroke="none"
  textColor: "white"

スタイルC: inverted（3個）
  最初に背景: <rect x="0" y="0" width="100" height="100" fill="FRAMECOLOR"/>
  その上にフレーム: fill="none" stroke="white" stroke-width="5"
  textColor: "white"

【フレーム形状（10個すべて異なる形にすること）】
正円 / 角丸四角 / ヘキサゴン / ダイアモンド /
二重円(outline限定) / ギザギザスタンプ / アーチ形 / 吹き出し /
楕円 / ブラケット型

JSONのみ返答（コードブロック・説明不要）:
[{
  "label": "日本語5文字以内",
  "framesvg": "SVG要素のみ（<svg>タグなし・FRAMECOLORのみ使用）",
  "fillStyle": "outline|filled|inverted",
  "textColor": "FRAMECOLOR または white"
}, ...10個]`,
      },
    ],
  });

  const text =
    message.content?.map((b) => ("text" in b ? b.text : "")).join("") ?? "";
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) {
    return NextResponse.json({ error: "SVG解析失敗" }, { status: 500 });
  }

  const parsed: Array<{
    label: string;
    framesvg: string;
    fillStyle: string;
    textColor: string;
  }> = JSON.parse(m[0]);

  const icons = parsed.map((item) => {
    const {
      label,
      framesvg = "",
      fillStyle = "outline",
      textColor = "FRAMECOLOR",
    } = item;

    // dy・fontSizeはClaudeに任せず、コード側で確定値を使う
    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  ${framesvg}
  <text x="50" y="50" dy="0" text-anchor="middle" dominant-baseline="central"
    font-size="${fontSize}" font-family="system-ui, sans-serif" font-weight="900"
    fill="${textColor}" stroke="none" letter-spacing="-1">${L}</text>
</svg>`;

    return { label, svg, isAlphaSvg: true, fillStyle };
  });

  return NextResponse.json({ icons });
}
