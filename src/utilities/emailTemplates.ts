const baseUrl = (serverURL?: string): string => (serverURL || process.env.SERVER_URL || 'http://localhost:3000').replace(/\/+$/, '')

const layout = (title: string, bodyHtml: string, cta: { href: string; label: string }, note: string): string => `<!doctype html>
<html lang="tr">
  <body style="margin:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:520px;margin:0 auto;padding:32px 16px;">
      <div style="text-align:center;padding:8px 0 16px;">
        <span style="font-size:20px;font-weight:700;color:#18181b;">Arwenis</span>
      </div>
      <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:28px;">
        <h2 style="margin:0 0 12px;color:#18181b;font-size:18px;">${title}</h2>
        <div style="color:#52525b;line-height:1.6;font-size:14px;">${bodyHtml}</div>
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="${cta.href}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 22px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${cta.label}</a>
        </div>
        <p style="color:#a1a1aa;font-size:12px;line-height:1.5;margin:16px 0 0;">${note}</p>
        <p style="color:#a1a1aa;font-size:12px;line-height:1.5;margin:8px 0 0;word-break:break-all;">${cta.href}</p>
      </div>
    </div>
  </body>
</html>`

export const generateForgotPasswordEmail = ({ token, serverURL }: { token?: string; serverURL?: string }): string => {
    const href = `${baseUrl(serverURL)}/reset-password?token=${token ?? ''}`
    return layout(
        'Şifre Sıfırlama',
        'Arwenis hesabının şifresini sıfırlamak için bir istek aldık. Bu isteği sen yaptıysan aşağıdaki butona tıkla. Yapmadıysan bu e-postayı yok sayabilirsin.',
        { href, label: 'Şifremi Sıfırla' },
        'Bağlantı kısa süre içinde geçerliliğini yitirir.',
    )
}

export const generateVerificationEmail = ({ token, serverURL }: { token?: string; serverURL?: string }): string => {
    const href = `${baseUrl(serverURL)}/verify-email?token=${token ?? ''}`
    return layout(
        'E-posta Adresini Doğrula',
        'Arwenis’e hoş geldin! Hesabını etkinleştirmek ve giriş yapabilmek için e-posta adresini doğrulaman gerekiyor.',
        { href, label: 'E-postamı Doğrula' },
        'Bu hesabı sen oluşturmadıysan bu e-postayı yok sayabilirsin.',
    )
}
