export type ImageTool = 'nanobananaPro' | 'midjourney' | 'chatgpt' | 'firefly'

export interface ImageToolConfig {
  label: string
  emoji: string
  description: string
  language: 'ja' | 'en' | 'both'
}

export const IMAGE_TOOL_CONFIG: Record<ImageTool, ImageToolConfig> = {
  nanobananaPro: {
    label: 'NanoBanana Pro',
    emoji: '🍌',
    description: '構造化テンプレート形式（役割/背景/依頼/フォーマット/制約）',
    language: 'ja',
  },
  midjourney: {
    label: 'Midjourney / Niji',
    emoji: '🎨',
    description: '英語プロンプト＋パラメータ記法（--ar --v 等）',
    language: 'en',
  },
  chatgpt: {
    label: 'ChatGPT Image',
    emoji: '🤖',
    description: '自然言語での詳細描写（DALL-E / GPT-4o）',
    language: 'both',
  },
  firefly: {
    label: 'Adobe Firefly',
    emoji: '🔥',
    description: '英語・写真リアル系・商用利用安全',
    language: 'en',
  },
}

export function buildImagePromptInstruction(
  tool: ImageTool,
  articleContent: string,
  media: string,
  extraElements: string,
): string {
  const articleSummary = articleContent.slice(0, 800)
  const elementsNote = extraElements.trim()
    ? `\nユーザーが指定した追加要素：${extraElements.trim()}`
    : ''

  switch (tool) {
    case 'nanobananaPro':
      return `
以下の記事のサムネイル・アイキャッチ画像を作成するための、NanoBanana Pro向け画像生成プロンプトを作成してください。
NanoBanana Proは「役割/背景と目的/依頼内容/出力フォーマット/制約条件」の構造化テンプレートを使います。

記事内容（抜粋）：
${articleSummary}

投稿媒体：${media}
${elementsNote}

以下の形式で出力してください：

# 役割
（画像生成AIまたはデザイナーとしての役割を設定）

# 背景と目的
（記事の内容・媒体・読者ターゲットを踏まえた画像の目的）

# 依頼内容
（具体的にどんな画像を作りたいか）

# 出力フォーマット
（画像のサイズ・スタイル・構図など）

# 制約条件
（避けるべき要素・トーン・著作権への配慮など）
`.trim()

    case 'midjourney':
      return `
以下の記事に合うサムネイル・アイキャッチ画像のMidjourney/Niji向けプロンプトを英語で1つ作成してください。

記事内容（抜粋）：
${articleSummary}

投稿媒体：${media}
${elementsNote}

【Midjourneyプロンプトのルール】
- カンマ区切りの英語キーワード形式
- スタイル・雰囲気・構図・色調・照明を含める
- 末尾に必ずパラメータを付ける（例: --ar 16:9 --v 6.1 --style raw）
- niji向けの場合は --niji 6 を使う
- ネガティブプロンプトがあれば --no で指定

プロンプトのみを出力してください（説明文は不要）。
`.trim()

    case 'chatgpt':
      return `
以下の記事に合うサムネイル・アイキャッチ画像のChatGPT（DALL-E/GPT-4o）向けプロンプトを1つ作成してください。

記事内容（抜粋）：
${articleSummary}

投稿媒体：${media}
${elementsNote}

【ChatGPT Imageプロンプトのルール】
- 自然言語で詳細に描写する（日本語でも英語でもOK、より効果的な方を選ぶ）
- 画像のスタイル・雰囲気・構図・色調・被写体を具体的に書く
- 「〜な画像を生成してください」という依頼文形式で書く
- 避けてほしい要素があれば「〜は含めないでください」と明示する

プロンプトのみを出力してください（説明文は不要）。
`.trim()

    case 'firefly':
      return `
以下の記事に合うサムネイル・アイキャッチ画像のAdobe Firefly向けプロンプトを英語で1つ作成してください。

記事内容（抜粋）：
${articleSummary}

投稿媒体：${media}
${elementsNote}

【Adobe Fireflyプロンプトのルール】
- 英語の自然な描写文
- 写真リアル・商用利用可能なスタイルを意識する
- 被写体・背景・ライティング・カメラアングル・色調を含める
- スタイル指定は "photo realistic", "flat design", "3D render" など明示する
- 文字・ロゴは含めない旨を入れる（Fireflyはテキスト生成が不安定なため）

プロンプトのみを出力してください（説明文は不要）。
`.trim()
  }
}
