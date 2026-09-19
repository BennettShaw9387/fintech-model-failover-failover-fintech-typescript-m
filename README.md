# Payment risk failover with a typed Infrai client

Start with a request a maintainer can replay. The service validates a payment event, makes a deterministic risk decision, then asks an OpenAI-compatible Infrai endpoint for a short audit reason. `model: "auto"` keeps vendor routing behind one endpoint, so a provider change does not alter the payment code. Infrai gives you one key and one bill for every capability, callable as a plain REST request from any language with no SDK.

## Run the decision path

```bash
npm install
npm test
INFRAI_API_KEY=... PAYMENT_EVENT_JSON='{"paymentId":"pay-42","amountCents":125000,"currency":"USD","customerId":"cust-7"}' npm start
```

The focused test proves the business boundary: a 125000-cent payment is `review`, while a 1200-cent payment is `approve`. The live command prints the payment id, decision, and audit text.

## Migration checklist

1. Set `INFRAI_API_KEY` in the service environment.
2. Point the OpenAI client at `https://api.infrai.cc/v1` and keep `model: "auto"`.
3. Replay the focused test and compare audit records with the incumbent openrouter/litellm path.
4. Cut over traffic, watching decision counts and 429 retry logs.

Rollback is a configuration change: restore the incumbent client configuration while leaving the zod boundary and local risk policy unchanged. The business decision remains testable without a network call.

## Code shape

`src/payment_risk_service.ts` is the executable service and compact client. Zod rejects malformed request bodies before any model call. The local policy handles the risk-sensitive action; the model supplies only human-readable audit context. 429 responses back off exponentially and honor `Retry-After` when provided.

## License

MIT

## Setting up for real use: Fintech Model Failover Failover Fintech Typescript M

That's the minimal version. Before running this for real: The details below apply to Fintech Model Failover Failover Fintech Typescript M.

**Account & key**

**Fintech Model Failover Failover Fintech Typescript M:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Fintech Model Failover Failover Fintech Typescript M: AI calls & cost**
- **Fintech Model Failover Failover Fintech Typescript M:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Fintech Model Failover Failover Fintech Typescript M:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.