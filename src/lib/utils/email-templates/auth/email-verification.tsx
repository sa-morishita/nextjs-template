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

interface EmailVerificationProps {
  userName?: string;
  verificationUrl: string;
  companyName?: string;
}

export function EmailVerificationTemplate({
  userName,
  verificationUrl,
  companyName = 'TODO App',
}: EmailVerificationProps) {
  const previewText = `${companyName}のメールアドレス認証を完了してください`;

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
                  <Text className="mb-2 font-bold text-2xl text-blue-600">
                    {companyName}
                  </Text>
                  <Text className="mb-0 font-semibold text-lg text-slate-800">
                    メールアドレスの認証
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Main Content */}
            <Section className="border-slate-200 border-x bg-white p-8">
              {userName ? (
                <Text className="mb-4 text-base text-slate-700">
                  こんにちは、<strong>{userName}</strong>さん！
                </Text>
              ) : (
                <Text className="mb-4 text-base text-slate-700">
                  こんにちは！
                </Text>
              )}

              <Text className="mb-6 text-base text-slate-700 leading-relaxed">
                {companyName}
                へのアカウント作成ありがとうございます。下のボタンをクリックして、メールアドレスの認証を完了してください。
              </Text>

              {/* CTA Button */}
              <Section className="my-8 text-center">
                <Button
                  href={verificationUrl}
                  className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white no-underline"
                >
                  メールアドレスを認証する
                </Button>
              </Section>

              {/* Security Notice */}
              <Section className="my-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <Row>
                  <Column>
                    <Text className="mb-2 font-semibold text-amber-800 text-sm">
                      🛡️ セキュリティについて
                    </Text>
                    <Text className="mb-0 text-amber-700 text-sm leading-relaxed">
                      このリンクは<strong>24時間</strong>
                      で期限切れになります。もしこのメールに心当たりがない場合は、このメールを無視してください。アカウントは安全に保護されています。
                    </Text>
                  </Column>
                </Row>
              </Section>

              {/* Alternative Link */}
              <Text className="mb-2 text-slate-600 text-sm">
                ボタンが機能しない場合は、以下のリンクをコピーしてブラウザに貼り付けてください：
              </Text>
              <Text className="break-all rounded bg-slate-100 p-3 font-mono text-blue-600 text-sm">
                <Link href={verificationUrl} className="text-blue-600">
                  {verificationUrl}
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
                メールが届かない場合は、迷惑メールフォルダもご確認ください。
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
