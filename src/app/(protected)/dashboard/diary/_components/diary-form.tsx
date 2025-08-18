/**
 * DiaryForm Component (Client Component)
 *
 * 日記作成フォーム
 * Container/Presentationalパターンにおける末端のClient Component
 */
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  createDiaryAction,
  getSignedUploadUrlAction,
} from '@/lib/actions/diary';
import { DIARY_MESSAGES } from '@/lib/domain/diary';
import { UPLOAD_MESSAGES } from '@/lib/domain/upload';
import { createDiaryFormSchema } from '@/lib/schemas';
import { uploadFileWithSignedUrl } from '@/lib/services/image-upload-client.service';
import { convertActionErrorToMessage } from '@/lib/utils/error-converter';

interface DiaryFormProps {
  hasTodaysDiary: boolean;
}

export function DiaryForm({ hasTodaysDiary }: DiaryFormProps) {
  const titleInputId = useId();
  const contentInputId = useId();
  const imageInputId = useId();

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { form, handleSubmitWithAction } = useHookFormAction(
    createDiaryAction,
    zodResolver(createDiaryFormSchema),
    {
      formProps: {
        mode: 'onSubmit',
        defaultValues: {
          title: '',
          content: '',
          imageUrl: '',
        },
      },
      actionProps: {
        onSuccess: () => {
          form.reset();
          setPreviewUrl('');
          setUploadedImageUrl('');
          toast.success(DIARY_MESSAGES.CREATION_SUCCESS);
        },
        onError: ({ error }) => {
          const message = convertActionErrorToMessage(
            error,
            DIARY_MESSAGES.CREATION_ERROR,
          );
          toast.error(message);
        },
      },
    },
  );

  const { execute: getSignedUrl } = useAction(getSignedUploadUrlAction, {
    onSuccess: async (result) => {
      if (result.data && pendingFile) {
        try {
          // Presigned URLを使ってクライアントから直接アップロード
          await uploadFileWithSignedUrl(pendingFile, result.data.signedUrl);

          setUploadedImageUrl(result.data.publicUrl);
          form.setValue('imageUrl', result.data.publicUrl);
          toast.success(UPLOAD_MESSAGES.UPLOAD_SUCCESS);
        } catch (error) {
          console.error('Upload error:', error);
          toast.error(UPLOAD_MESSAGES.UPLOAD_ERROR);
        } finally {
          setIsUploading(false);
          setPendingFile(null);
        }
      }
    },
    onError: ({ error }) => {
      const message = convertActionErrorToMessage(
        error,
        UPLOAD_MESSAGES.UPLOAD_URL_GENERATION_ERROR,
      );
      toast.error(message);
      setIsUploading(false);
      setPendingFile(null);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // プレビュー用URLを設定
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);
    setIsUploading(true);
    setPendingFile(file);

    // Presigned URLを取得
    await getSignedUrl({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmitWithAction} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={titleInputId}>タイトル</FormLabel>
              <FormControl>
                <Input
                  id={titleInputId}
                  placeholder="今日のタイトル"
                  autoFocus
                  disabled={hasTodaysDiary}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                今日の日記のタイトルを入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={contentInputId}>内容</FormLabel>
              <FormControl>
                <Textarea
                  id={contentInputId}
                  placeholder="今日の出来事を書きましょう..."
                  className="min-h-[150px] resize-none"
                  disabled={hasTodaysDiary}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                今日の出来事や感じたことを記録しましょう
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 画像アップロード */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={() => (
            <FormItem>
              <FormLabel>写真</FormLabel>
              <FormControl>
                <Input
                  id={imageInputId}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  disabled={hasTodaysDiary || isUploading}
                />
              </FormControl>
              <FormDescription>
                JPEG、PNG、WebP形式のみ対応。最大5MBまで。
              </FormDescription>
              <FormMessage />
              {isUploading && (
                <p className="text-muted-foreground text-sm">
                  画像をアップロード中...
                </p>
              )}
              {previewUrl && (
                <div className="relative mt-2 h-32 w-48">
                  <Image
                    src={previewUrl}
                    alt="アップロード画像"
                    fill
                    className="rounded border object-cover"
                  />
                </div>
              )}
              {uploadedImageUrl && !isUploading && (
                <p className="text-green-600 text-sm">
                  ✓ 画像がアップロードされました
                </p>
              )}
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={
            form.formState.isSubmitting || hasTodaysDiary || isUploading
          }
        >
          {hasTodaysDiary
            ? '本日の日記は作成済みです'
            : form.formState.isSubmitting
              ? '作成中...'
              : '日記を作成'}
        </Button>
      </form>
    </Form>
  );
}
