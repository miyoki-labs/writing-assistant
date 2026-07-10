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

## 2026-07-09（公開デモ用「サンプルモード」＋README）

**背景**：ポートフォリオの実績のうち本ツールは**GitHubリンクのみ・READMEなし**で、リポを開いても何のツールか分からなかった（`計画\04_ポートフォリオ計画.md`）。

**READMEを新設**：BYOK方式（APIキーはlocalStorageのみ・サーバー送信なし）、媒体別プロンプト（Zenn/Qiita/note/X）、4プロバイダ（Anthropic/OpenAI/DeepSeek/Gemini）、GitHub README読み込み、文体参照、トークンコスト表示。

**サンプルモード**（`VITE_DEMO_MODE=1`）
- 本ツールはBYOKなので**公開してもAPIコストは利用者持ち**。ただし**キーが無い人は何も体験できない**ため、「サンプル出力を見る」経路を追加した
- `src/demo.ts`：`DEMO_MODE` / `SAMPLE_TOPIC` / `SAMPLE_OUTPUTS`（zenn/qiita/note/x）。**同じトピックで媒体ごとに構成・語調・長さが変わる**ことを見せるのが目的（このツールの価値そのもの）
- `useStreamingChat` に `streamSample(media)` を追加。生成は行わず、事前出力を再生
- `src/vite-env.d.ts` を新設（`import.meta.env` の型が無く `tsc -b` が TS2339 で落ちた）

**サンプル再生が履歴を汚す問題**：生成終了時に履歴へ保存する `useEffect` が、サンプル再生の終了でも発火し、**空トピックの履歴が残っていた**。`isSampleRef` で除外。

### 発見：出力欄の再描画が1回あたり約0.4秒と重い

サンプルを1文字ずつ流したところ、**10秒で75字**しか進まなかった。`setOutput` のたびに出力欄がフル再描画されているのが原因で、**これは実際の生成時にも効いている**（ストリーミングのチャンクごとに同じコストを払っている）。
暫定対応としてサンプル再生をステップ固定（20ティック）に変更。**描画の最適化は Phase 2 の課題**（出力欄のメモ化・差分描画）。

**検証**：`tsc -b` 通過 → `VITE_DEMO_MODE=1 vite build` → `vite preview` で「サンプル出力を見る（zenn）」を実行し、Zenn向けfrontmatter付きの出力が流れること、履歴が空のままであることを目視確認。

---

## 2026-07-10｜訂正：「出力欄の再描画が1回0.4秒」は誤り（実測 15〜18ms）

前回（2026-07-09）「`setOutput` のたびにフル再描画されて1回約0.4秒」と書いたが、**測ったら約20倍の過大評価だった**。

本番ビルド（`writing-assistant-orpin.vercel.app`）をヘッドレスChromeで開き、`PerformanceObserver` で `longtask`（50ms超のメインスレッド占有）を拾いながら「サンプル出力を見る」を実行した結果、3回とも：

| 指標 | 実測 |
|---|---|
| 出力文字数 | 845字 |
| 再生の総時間 | 1,164 / 1,170 / 1,101 ms |
| sleep 分（20tick×40ms） | 800 ms |
| 描画に使われた分 | 364 / 370 / 301 ms |
| **1描画あたり** | **15〜18 ms** |
| **long task (>50ms)** | **0 件** |

1描画0.4秒が本当なら 20描画で 8.8秒かかるはずだが、実際は 1.1秒で終わる。**long task が1件も出ていない**のが決定的で、フル再描画による重さは存在しない。

**なぜ間違えたか**：前回の「10秒で75字」はブラウザ自動化ごしの壁時計で、拡張機能のオーバーヘッドが混ざっていた（前回時点で自分でも「未計測・推測」と書いていた）。**推測を回避策として実装してしまった**のが実害で、`streamSample` の「20ティックに間引く」は不要な上に、845字を20回で流すため1回42字ずつ飛び、タイプ風に見えなくなっている。

**次の一手**：`useStreamingChat.ts` の `TICKS = 20` 固定を戻し、1描画15msを前提に「2〜3字 / 約16ms」で流す。出力欄のメモ化・差分描画は**やらない**（直す理由が消えた）。

## 2026-07-10（サンプル再生の「遅さ」は幻だった／原因は非表示タブのタイマークランプ）

**経緯**：サンプル再生を1文字ずつ流したとき「10秒で75字」しか進まず、`setOutput` の再描画が重いと結論して `TICKS = 20`（本文を20分割）という回避策を入れた。その後の計測で「1描画15〜18ms・long task 0件」と分かり、回避策は不要と判断。今回それを撤去する過程で、**そもそも遅くなかった真因**が判明した。

**真因**：ブラウザ自動化中はタブが `hidden` になり、**`setTimeout` が1秒に1回へクランプされる**。ページ内で直接測って確定した。

```
visibilityState: "hidden" / hidden: true / hasFocus: false
setTimeout(12ms) の実測: [113, 1000, 1000, 1000, 1000] ms
```

3.9秒で出力6文字・**long task 0件**（メインスレッドは全く忙しくない）。`requestAnimationFrame` も hidden タブでは止まるため、rAFで計測しようとして CDP が45秒でタイムアウトした。

**訂正の連鎖**
- 「再描画が1回0.4秒」→ **誤り**（自動化の壁時計から逆算した数字）
- 「原因は拡張機能のオーバーヘッド」→ **これも誤り**
- 正しくは **hidden タブのタイマークランプ（1Hz）**。描画は速い

**対応**：`TICKS = 20` を撤去し、`STEP = 2` / 12ms の逐次再生に戻した（845字で約5秒）。同じ罠を踏まないよう、コメントに真因を明記。本番バンドルから `length/20` が消え、`setTimeout(x,12)` に置き換わったことを確認済み。

**学び**
- **ブラウザ自動化の壁時計でフロントの性能を測らない。** タブが hidden ならタイマーは1Hz、rAFは停止する
- 「遅い」と感じたら、まず `document.visibilityState` と `long task` を見る。**long task が0なら、それは描画の問題ではない**
- 推測で入れた回避策は、根拠が崩れたあとも**UXの劣化として残り続ける**（42字ずつ飛んでタイプ風に見えなくなっていた）
- **誤った原因をコメントに書くと、次に読む人が信じる。** 訂正はコードより先にコメントへ
