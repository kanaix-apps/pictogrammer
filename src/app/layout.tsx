import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ピクトグラマー",
  description: "キーワードからピクトグラムSVGを生成するWebサービス",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
