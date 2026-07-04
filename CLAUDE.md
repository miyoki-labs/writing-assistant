# Writing-Assistant CLAUDE.md

媒体別に文体を切替えて記事本文＋画像プロンプトを生成する執筆補助ツール。
ストリーミング生成・文体参照・履歴・トークンコスト可視化。技術：Vite / React / TypeScript。

## 開発ログ（必須）

- 開発したら**同じセッションで** `knowledge-log/history/main.md` に対応・知見・成果を追記する（旧CHANGELOGの役割）。
- 記事になりそうなら `knowledge-log/log.md` に1件昇格させる（🔬Miyoki Labsレーン・★評価）。
- 運用ルールの本体は `C:\Miyoki\ideas\_knowledge-log-rule.md`（マスター規約）。

## 品質チェック（Miyoki共通）

実装・修正の完了後は共通スキルを使う（正= `C:\Miyoki\.claude\skills\`）：
- `/quality-check` … 変更種別から該当チェックを逆引き（UI3幅/フォーム/API/デプロイ後）
- `/ux-review` … UX健全性の定期レビュー（汎用4軸＋固有軸）
- 薄い計画書＝ `C:\Miyoki\計画\プロジェクト別\` の同名md（目的/現在地/次の一手）
