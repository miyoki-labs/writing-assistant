# 執筆補助ツール（Writing Assistant）

**書きたい媒体を選ぶと、その媒体の作法に合わせた原稿をAIがストリーミングで書き起こす**、個人開発者向けの執筆支援ツールです。GitHubリポジトリのREADMEを読み込ませて、開発ログの下書きを作るところまでを1画面で行います。

> **APIキーはブラウザの localStorage にのみ保存され、サーバーには送信されません。**
> 自分のAPIキーを持ち込んで使う方式（BYOK）なので、利用料は使う人のアカウントに直接かかります。

---

## 何ができるか

- **媒体別の書き分け**：Zenn / Qiita / note / X の4媒体。それぞれ見出し構成・語調・文字数の作法が違うため、媒体ごとにシステムプロンプトとフォーマット指示を持たせています（`src/prompts/mediaPrompts.ts`）
- **ストリーミング生成**：生成中の文章が逐次表示される（`src/hooks/useStreamingChat.ts`）
- **GitHubリポジトリの読み込み**：リポジトリURLを貼るとREADMEを取得し、素材として渡せる（`src/components/GitHubInput.tsx`）
- **文体の参照テキスト**：自分の過去記事を貼っておくと、その文体に寄せて書く（`src/components/ReferenceText.tsx`）
- **文字数コントロール**：目標文字数を指定して長さを制御
- **画像プロンプト生成**：本文からアイキャッチ用の画像生成プロンプトを作る（`src/hooks/useImagePrompts.ts`）
- **履歴**：生成結果をローカルに保存して見返せる
- **トークン使用量とコスト表示**：入出力トークンから USD / JPY を概算表示（`src/utils/tokenCost.ts`）

## 対応プロバイダ

`src/providers/streamingProvider.ts` で4つを切り替えられます。

| プロバイダ | 備考 |
|---|---|
| Anthropic (Claude) | 既定 |
| OpenAI | |
| DeepSeek | OpenAI互換エンドポイントを流用 |
| Google (Gemini) | |

---

## 技術スタック

React 19 / TypeScript / Vite 6 / Tailwind CSS
`@anthropic-ai/sdk` / `openai` / `@google/generative-ai`

## 使い方

```bash
npm install
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build
npm run preview
```

起動したら画面上部でプロバイダを選び、自分のAPIキーを貼り付けてください。`.env` は不要です（`.env.example` は開発時のフォールバック用）。

---

## つくった背景

Zenn・Qiita・note・X に同じネタを投稿しようとすると、媒体ごとに書き方を変える手間で手が止まります。「1本書いて4媒体に展開する」までを短くするために、**媒体の作法をプロンプト側に閉じ込めて、書く人は素材と文体だけ渡せばよい**形にしました。

自分の発信ワークフローで実際に使っている道具なので、機能は必要になった順に足しています。設計判断の記録は `knowledge-log/` を参照してください。

## 制作

Miyoki（AIプロダクトエンジニア） — [miyoki-labs.com](https://miyoki-labs.com)
