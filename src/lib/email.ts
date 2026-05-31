export async function sendMagicLinkEmail(params: {
  to: string;
  url: string;
}): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log(`[MAGIC LINK] ${params.to}: ${params.url}`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[EMAIL] No RESEND_API_KEY set; magic link not sent.");
    console.log(`[MAGIC LINK] ${params.to}: ${params.url}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "noreply@incubator-trust.com",
      to: params.to,
      subject: "Sign in to Incubator Trust Platform",
      html: `<p>Click <a href="${params.url}">here</a> to sign in to the Incubator Trust Platform.</p><p>This link expires in 24 hours.</p>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[EMAIL] Failed to send:", text);
  }
}

export async function sendNotificationEmail(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log(`[NOTIFICATION] ${params.subject} -> ${params.to}: ${params.body}`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "noreply@incubator-trust.com",
      to: params.to,
      subject: params.subject,
      html: params.body,
    }),
  }).catch(() => {});
}
