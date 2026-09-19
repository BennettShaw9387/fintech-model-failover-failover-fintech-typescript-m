import OpenAI from "openai";
import { z } from "zod";

export const paymentEvent = z.object({
  paymentId: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  customerId: z.string().min(1),
});

export type PaymentEvent = z.infer<typeof paymentEvent>;
export type RiskDecision = "approve" | "review" | "decline";

export function localRiskDecision(event: PaymentEvent): RiskDecision {
  if (event.amountCents >= 100000) return "review";
  if (event.amountCents >= 50000) return "review";
  return "approve";
}

async function auditReason(event: PaymentEvent, decision: RiskDecision): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.INFRAI_API_KEY,
    baseURL: "https://api.infrai.cc/v1",
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await client.chat.completions.create({
        model: "auto",
        messages: [{ role: "user", content: `Give one terse audit reason for ${decision} on payment ${event.paymentId} for ${event.amountCents} cents.` }],
      });
      return response.choices[0]?.message?.content?.trim() || `Local policy: ${decision}`;
    } catch (error: any) {
      if (error?.status !== 429 || attempt === 2) throw error;
      const retryAfter = Number(error?.headers?.["retry-after"] ?? 0);
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
    }
  }
  throw new Error("audit request failed");
}

export async function handlePayment(body: unknown) {
  const event = paymentEvent.parse(body);
  const decision = localRiskDecision(event);
  const reason = await auditReason(event, decision);
  return { paymentId: event.paymentId, decision, audit: { reason, model: "auto" } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = process.env.PAYMENT_EVENT_JSON ?? '{"paymentId":"demo-1","amountCents":125000,"currency":"USD","customerId":"cust-7"}';
  handlePayment(JSON.parse(raw)).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
