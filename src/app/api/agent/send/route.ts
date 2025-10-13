import { NextRequest } from "next/server";
import { z } from "zod";
import { toolSendEmail } from "@/utils/tools";
import { sendEmail } from "@/utils/email";
import { createLogger } from "@/utils/logger";

const BodySchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const logger = createLogger();
  logger.step("send:request:start");

  let json: any;
  try {
    json = await req.json();
  } catch (e) {
    logger.warn("send:bad-json", { err: String(e) });
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const parse = BodySchema.safeParse(json);
  if (!parse.success) {
    logger.warn("send:validation-failed", { issues: parse.error.issues });
    return new Response(
      JSON.stringify({ error: "Invalid body", issues: parse.error.issues }),
      { status: 400 }
    );
  }

  const { to, subject, html } = parse.data;
  try {
    logger.step("send:begin", { to });
    // Prefer local nodemailer if SMTP env is configured; otherwise fall back to toolSendEmail mock
    if (process.env.NEXT_PUBLIC_SMTP_HOST) {
      await sendEmail({ to, subject, html });
      logger.info("send:ok:nodemailer", { to });
      return new Response(JSON.stringify({ ok: true, provider: "smtp" }), { status: 200 });
    }
    const res = await toolSendEmail({ to, subject, html });
    logger.info("send:ok:tool", { to });
    return new Response(JSON.stringify({ ok: true, provider: res?.provider || "tool" }), { status: 200 });
  } catch (e) {
    logger.error("send:failed", { err: String(e) });
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  } finally {
    logger.done();
  }
}


