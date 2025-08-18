import {
  Body,
  Button,
  Column,
  Container,
  Font,
  Head,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface PasswordResetProps {
  userName?: string;
  resetUrl: string;
  companyName?: string;
}

/**
 * パスワードリセット用 React Email テンプレート
 */
export function PasswordResetTemplate({
  userName,
  resetUrl,
  companyName = 'TODO App',
}: PasswordResetProps) {
  const previewText = `${companyName}のパスワードリセット要求`;

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily={['Arial', 'sans-serif']}
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto max-w-2xl px-4 py-8">
            {/* Header */}
            <Section className="rounded-t-lg border border-slate-200 bg-white p-8">
              <Row>
                <Column className="text-center">
                  <Text className="mb-2 font-bold text-2xl text-red-600">
                    {companyName}
                  </Text>
                  <Text className="mb-0 font-semibold text-lg text-slate-800">
                    パスワードのリセット
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Main Content */}
            <Section className="border-slate-200 border-x bg-white p-8">
              {userName ? (
                <Text className="mb-4 text-base text-slate-700">
                  こんにちは、<strong>{userName}</strong>さん
                </Text>
              ) : (
                <Text className="mb-4 text-base text-slate-700">
                  こんにちは
                </Text>
              )}

              <Text className="mb-6 text-base text-slate-700 leading-relaxed">
                パスワードリセットのリクエストを受け付けました。下のボタンをクリックして、新しいパスワードを設定してください。
              </Text>

              {/* CTA Button */}
              <Section className="my-8 text-center">
                <Button
                  href={resetUrl}
                  className="rounded-lg bg-red-600 px-8 py-3 font-semibold text-white no-underline"
                >
                  パスワードをリセットする
                </Button>
              </Section>

              {/* Security Notice */}
              <Section className="my-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <Row>
                  <Column>
                    <Text className="mb-2 font-semibold text-red-800 text-sm">
                      🔒 重要なセキュリティ情報
                    </Text>
                    <div className="text-red-700 text-sm leading-relaxed">
                      <Text className="mb-1">
                        • このリンクは<strong>1時間</strong>で期限切れになります
                      </Text>
                      <Text className="mb-1">
                        •
                        もしパスワードリセットを要求していない場合は、このメールを無視してください
                      </Text>
                      <Text className="mb-0">
                        • アカウントは安全に保護されています
                      </Text>
                    </div>
                  </Column>
                </Row>
              </Section>

              {/* Alternative Link */}
              <Text className="mb-2 text-slate-600 text-sm">
                ボタンが機能しない場合は、以下のリンクをコピーしてブラウザに貼り付けてください：
              </Text>
              <Text className="break-all rounded bg-slate-100 p-3 font-mono text-red-600 text-sm">
                <Link href={resetUrl} className="text-red-600">
                  {resetUrl}
                </Link>
              </Text>
            </Section>

            {/* Footer */}
            <Section className="rounded-b-lg border border-slate-200 bg-slate-100 p-6 text-center">
              <Text className="mb-2 text-slate-600 text-sm">
                このメールは<strong>{companyName}</strong>から送信されました。
              </Text>
              <Text className="mb-0 text-slate-500 text-sm">
                ご質問がある場合は、サポートまでお問い合わせください。
              </Text>
            </Section>

            {/* Email Best Practices Footer */}
            <Section className="mt-6 text-center">
              <Text className="text-slate-500 text-xs">
                このメールが不正な要求の場合は、すぐにサポートにご連絡ください。
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
