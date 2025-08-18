/**
 * Sonner Toast Wrapper
 *
 * ベストプラクティス: サードパーティライブラリのClient Boundary明示化
 *
 * 1. Client Boundaryの明示
 *    - "use client"により、このファイル以降はClient Components
 *    - サードパーティライブラリがRSC未対応の場合は必須
 *
 * 2. プロジェクト固有の設定を統合
 *    - テーマ連携（next-themes）
 *    - カスタムスタイリング
 *
 * 3. 再利用性の確保
 *    - 元のAPIを可能な限り維持（ToasterProps）
 *    - 必要な拡張のみ追加
 */
'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-center"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
