# 生ログ（history）— Writing-Assistant

> 開発したら、同じセッションでここに追記する（旧 CHANGELOG の役割）。事実ベース・網羅でよい。
> 記事になりそうなものは `../log.md` に1件昇格させる。

---

## 2026-05-31（初回・過去分の遡り）

- `feat: initial commit — Writing Assistant`（初回コミット）。※README無しのため src 構成から知見を起こす。
- 構成（`src/`）：
  - 媒体別プロンプト `prompts/mediaPrompts.ts` ＋ `components/MediaSelector.tsx` … 媒体で文体・構成を切替
  - ストリーミング `hooks/useStreamingChat.ts` ＋ `providers/streamingProvider.ts` … 逐次表示
  - 画像プロンプト生成 `prompts/imagePrompts.ts` ＋ `hooks/useImagePrompts.ts` ＋ `components/ImagePromptGenerator.tsx`
  - 文体参照 `components/ReferenceText.tsx` ／ 取込 `components/GitHubInput.tsx`
  - 履歴 `components/HistoryModal.tsx` `HistoryPanel.tsx`
  - トークンコスト `utils/tokenCost.ts` ＋ `components/TokenUsageDisplay.tsx` … API使用量・料金を可視化
  - APIキー入力 `components/ApiKeyInput.tsx`（クライアント側）／ 文字数制御 `CharCountControl.tsx` ／ 種別選択 `ContentTypeSelector.tsx`
- 技術：Vite / React / TypeScript（`main.tsx` / `App.tsx`）。

> ※ 以降の変更はこのファイルに随時追記していく。
