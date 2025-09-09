# Next.js Image Blur Placeholder Patterns

## Overview

Next.js ImageコンポーネントのblurDataURLを使用したローディング体験改善のベストプラクティス。
2025年8月現在の最新手法に基づいて、クライアントサイドでblur生成し、Server Actionsで送信する方式を採用。

## Architecture

### Flow
1. **File Selection** → クライアントサイドでFile選択
2. **Blur Generation** → Canvas APIを使用してblurDataURL生成（非同期）
3. **Upload Process** → Presigned URLでアップロード実行
4. **Server Action** → blurDataURLをServer Actionsの引数として送信
5. **Database Storage** → 画像URLとblurDataURLをセットで保存
6. **Display** → Next.js ImageコンポーネントでplaceholderとしてblurDataURL使用

### Benefits
- ✅ サーバー側の無駄な通信なし（画像の再ダウンロード不要）
- ✅ リアルタイムでblur生成
- ✅ 生成データは超軽量（~100-200バイト）
- ✅ Server Actions引数として送信可能
- ✅ Storage service role key不要

## Implementation

### 1. Blur Generation Utility

```typescript
// lib/utils/blur-generator.ts
export const generateClientBlurDataURL = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // 超小サイズ（8x8推奨、10x10max）
      canvas.width = 8;
      canvas.height = 8;
      
      // 軽いblur効果
      ctx.filter = 'blur(1px)';
      ctx.drawImage(img, 0, 0, 8, 8);
      
      // 高圧縮JPEG
      const blurDataUrl = canvas.toDataURL('image/jpeg', 0.3);
      resolve(blurDataUrl);
    };
    
    img.src = URL.createObjectURL(file);
  });
};
```

### 2. Form Integration

```typescript
// components/form/image-upload-form.tsx
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // プレビュー設定
  setPreviewUrl(URL.createObjectURL(file));
  setIsUploading(true);
  setPendingFile(file);

  // blur生成（非同期で並列実行）
  const blurDataUrlPromise = generateClientBlurDataURL(file);
  
  // Presigned URL取得・アップロード
  await getSignedUrl({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });
  
  // blur生成完了を待ってformに設定
  const blurDataUrl = await blurDataUrlPromise;
  form.setValue('blurDataUrl', blurDataUrl);
};
```

### 3. Schema Extension

```typescript
// lib/schemas/[entity].ts
export const createEntityFormSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(2000),
  imageUrl: z.string().optional(),
  blurDataUrl: z.string().optional(), // 追加
});

// db/schema/[entity].ts
export const entitiesTable = pgTable('entities', {
  // 既存フィールド...
  imageUrl: text('image_url'),
  blurDataUrl: text('blur_data_url'), // 追加
});
```

### 4. Display Component

```tsx
// components/display/image-display.tsx
<Image
  src={entity.imageUrl}
  alt="画像"
  placeholder={entity.blurDataUrl ? "blur" : "empty"}
  blurDataURL={entity.blurDataUrl}
  fill
  className="object-contain"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

## Performance Optimization

### Recommended Settings
- **Canvas Size**: 8x8px（10x10px max）
- **Image Quality**: JPEG 30%（0.3）
- **Blur Filter**: blur(1px)程度
- **Expected Data Size**: ~100-200バイト
- **Generation Time**: <50ms

### Advanced Optimization (Optional)

#### OffscreenCanvas for Heavy Processing
```typescript
// lib/utils/blur-generator-advanced.ts（重い処理の場合のみ）
export const generateBlurWithWorker = async (file: File): Promise<string> => {
  if ('OffscreenCanvas' in window) {
    // Worker内でOffscreenCanvasを使用
    const worker = new Worker('/workers/blur-worker.js');
    // ... Worker implementation
  } else {
    // Fallback to standard Canvas
    return generateClientBlurDataURL(file);
  }
};
```

## Migration Guide

### From No Blur to Blur Support

1. **Add Schema Field**
   ```sql
   ALTER TABLE entities ADD COLUMN blur_data_url TEXT;
   ```

2. **Update Form Component**
   - blur生成処理を追加
   - formスキーマにblurDataUrl追加

3. **Update Display Component**
   - placeholderとblurDataURL propsを追加

4. **Update Server Action**
   - blurDataUrlを受け取ってDB保存

### Existing Image Support

既存の画像データにblurDataURLがない場合：
```tsx
// Graceful degradation
<Image
  src={entity.imageUrl}
  alt="画像"
  placeholder={entity.blurDataUrl ? "blur" : "empty"}
  blurDataURL={entity.blurDataUrl || undefined}
  // ... other props
/>
```

## Browser Support

- **Canvas API**: 全モダンブラウザ対応
- **OffscreenCanvas**: Chrome 69+, Firefox 105+（Optional）
- **createObjectURL**: 全モダンブラウザ対応

## Common Use Cases

### 1. User Profile Images
```typescript
// プロフィール画像アップロード
const handleAvatarUpload = async (file: File) => {
  const blurDataUrl = await generateClientBlurDataURL(file);
  // ... upload process
  updateUserProfile({ avatarUrl, blurDataUrl });
};
```

### 2. Article/Post Images
```typescript
// 記事画像アップロード
const handlePostImageUpload = async (file: File) => {
  const blurDataUrl = await generateClientBlurDataURL(file);
  // ... upload process
  createPost({ content, imageUrl, blurDataUrl });
};
```

### 3. Gallery Images
```typescript
// ギャラリー画像表示
{images.map((image) => (
  <Image
    key={image.id}
    src={image.url}
    alt={image.alt}
    placeholder="blur"
    blurDataURL={image.blurDataUrl}
    className="gallery-image"
  />
))}
```

## Best Practices

1. **Always Generate Client-Side**: サーバー側での再ダウンロードを避ける
2. **Keep Size Small**: 8x8px推奨、最大10x10px
3. **Use High Compression**: JPEG品質30%程度
4. **Parallel Processing**: アップロードと並列でblur生成
5. **Graceful Degradation**: blurDataURLがない場合のfallback対応
6. **Error Handling**: blur生成失敗時の処理
7. **Memory Management**: createObjectURLのcleanup

## Troubleshooting

### Common Issues

1. **Large Data URLs**: サイズが大きすぎる場合は品質を下げる
2. **Canvas CORS**: 外部画像の場合はCORS設定確認
3. **Memory Leaks**: URL.revokeObjectURLでcleanup
4. **Performance**: 重い処理の場合はWeb Worker検討

### Debug Tips

```typescript
// デバッグ用：生成されたblurDataURLのサイズ確認
const debugBlurSize = (blurDataUrl: string) => {
  const sizeInBytes = Math.round((blurDataUrl.length * 3) / 4);
  console.log(`BlurDataURL size: ${sizeInBytes} bytes`);
};
```