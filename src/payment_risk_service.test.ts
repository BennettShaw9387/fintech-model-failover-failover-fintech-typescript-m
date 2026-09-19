import { strict as assert } from "node:assert";
import { localRiskDecision, paymentEvent } from "./payment_risk_service.js";

const event = paymentEvent.parse({ paymentId: "pay-42", amountCents: 125000, currency: "USD", customerId: "cust-7" });
assert.equal(localRiskDecision(event), "review");
assert.equal(localRiskDecision({ ...event, amountCents: 1200 }), "approve");
console.log("risk policy test passed");
