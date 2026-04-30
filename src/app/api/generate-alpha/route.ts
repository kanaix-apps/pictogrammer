import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { letter } = await req.json();
  if (!letter) {
    return NextResponse.json({ error: "letter is required" }, { status: 400 });
  }

  const L = letter.toUpperCase();

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    messages: [
      {
        role: "user",
        content: `アルファベット「${L}」を中央に表示するためのデコレーションフレームSVGを12種類生成してください。

【絶対に守ること】
- 文字は一切描画しない。フレーム・図形のみ生成する。
- 色には必ず FRAMECOLOR というプレースホルダー文字列を使う（#1a1a1aや#000は使わない）
- stroke-width は必ず 5〜8 の太さにする

【3スタイルを4個ずつ必ず生成】

スタイルA: outline（4個）
フレーム: fill="none" stroke="FRAMECOLOR" stroke-width="6"
textColor: "FRAMECOLOR"

スタイルB: filled（3個）
フレーム: fill="FRAMECOLOR" stroke="none"（塗りつぶし）
textColor: "white"

スタイルC: inverted（3個）
背景: <rect x="0" y="0" width="100" height="100" fill="FRAMECOLOR"/>
フレーム: fill="none" stroke="white" stroke-width="4"
textColor: "white"

フレーム形状（10個で使うこと）:
正円 / 角丸四角 / ヘキサゴン / ダイアモンド（45度回転した四角）/
二重円 / ギザギザスタンプ / アーチ形 / 吹き出し型 /
楕円 / ブラケット[]

JSONのみ返答:
[{
  "label":"日本語5文字以内",
  "framesvg":"SVG図形コード（FRAMECOLOR使用・文字なし）",
  "fillStyle":"outline|filled|inverted",
  "textColor":"FRAMECOLOR または white",
  "fontSize":34,
  "fontFamily":"sans-serif",
  "fontWeight":"900",
  "dy":0
},...10個]`,
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
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    dy: number;
  }> = JSON.parse(m[0]);

  const icons = parsed.map((item) => {
    const {
      label,
      framesvg = "",
      fillStyle = "outline",
      textColor = "FRAMECOLOR",
      fontSize = 34,
      fontFamily = "sans-serif",
      fontWeight = "900",
      dy = 0,
    } = item;

    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  ${framesvg}
  <text x="50" y="50" dy="${dy}" text-anchor="middle" dominant-baseline="central"
    font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}"
    fill="${textColor}" stroke="none">${L}</text>
</svg>`;

    return { label, svg, isAlphaSvg: true, fillStyle };
  });

  return NextResponse.json({ icons });
}
