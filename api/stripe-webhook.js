import crypto from "node:crypto";

/**
 * Stripe -> Vercel -> Google Apps Script
 *
 * Variables Vercel requises :
 * STRIPE_WEBHOOK_SECRET = whsec_...
 * GOOGLE_SCRIPT_URL = https://script.google.com/macros/s/.../exec
 * GOOGLE_WEBHOOK_SECRET = même valeur que CONFIG.WEBHOOK_SECRET dans Apps Script
 */

const TOLERANCE_SECONDS = 300;

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.split(",").map((part) => part.trim());
  let timestamp = null;
  const signatures = [];

  for (const part of parts) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value;
    if (key === "v1") signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return false;

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampNumber) > TOLERANCE_SECONDS) return false;

  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");

  return signatures.some((signature) => {
    try {
      const receivedBuffer = Buffer.from(signature, "hex");
      return (
        receivedBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
      );
    } catch {
      return false;
    }
  });
}

async function notifyGoogleAppsScript(session) {
  const reference = String(session.client_reference_id || "").trim();

  if (!reference) {
    throw new Error("client_reference_id manquant dans la session Stripe");
  }

  if (!/^GALA26-[A-Z0-9-]+$/i.test(reference)) {
    throw new Error(`Référence Gala invalide : ${reference}`);
  }

  const amountTotal = Number(session.amount_total || 0);
  if (!amountTotal || amountTotal <= 0) {
    throw new Error("Montant Stripe invalide");
  }

  const amountEuros = (amountTotal / 100).toFixed(2);

  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const transactionId = paymentIntent || session.id;

  const body = new URLSearchParams({
    action: "payment_confirmed",
    reference,
    transactionId,
    amount: amountEuros,
    webhookSecret: process.env.GOOGLE_WEBHOOK_SECRET,
  });

  const response = await fetch(process.env.GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `Google Apps Script a répondu HTTP ${response.status}`
    );
  }

  const text = await response.text();

  // Le Web App Apps Script renvoie normalement du JSON.
  // On laisse toutefois passer un texte non JSON pour faciliter le diagnostic.
  try {
    const result = JSON.parse(text);
    if (result.success === false) {
      throw new Error(result.error || "Erreur Apps Script");
    }
    return result;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { success: true, raw: text };
    }
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (
    !process.env.STRIPE_WEBHOOK_SECRET ||
    !process.env.GOOGLE_SCRIPT_URL ||
    !process.env.GOOGLE_WEBHOOK_SECRET
  ) {
    console.error("Variables d'environnement manquantes");
    return res.status(500).json({ error: "Server configuration error" });
  }

  let rawBody;

  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    console.error("Impossible de lire le body Stripe", error);
    return res.status(400).json({ error: "Invalid request body" });
  }

  const signatureHeader = req.headers["stripe-signature"];

  if (
    !verifyStripeSignature(
      rawBody,
      signatureHeader,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  ) {
    console.error("Signature Stripe invalide");
    return res.status(400).json({ error: "Invalid Stripe signature" });
  }

  let event;

  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch (error) {
    console.error("Payload Stripe JSON invalide", error);
    return res.status(400).json({ error: "Invalid JSON" });
  }

  // Paiement carte immédiat
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Pour un moyen de paiement différé, on attend async_payment_succeeded.
    if (session.payment_status !== "paid") {
      console.log(
        `Session ${session.id} terminée mais paiement_status=${session.payment_status}`
      );
      return res.status(200).json({ received: true, waitingForPayment: true });
    }

    try {
      const result = await notifyGoogleAppsScript(session);
      console.log("Gala payment processed", {
        eventId: event.id,
        sessionId: session.id,
        reference: session.client_reference_id,
        result,
      });
      return res.status(200).json({ received: true, processed: true });
    } catch (error) {
      console.error("Erreur traitement Gala", error);
      // 500 => Stripe retentera automatiquement l'événement.
      return res.status(500).json({
        error: "Gala fulfillment failed",
        detail: error.message,
      });
    }
  }

  // Moyens de paiement différés
  if (event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;

    try {
      const result = await notifyGoogleAppsScript(session);
      console.log("Gala async payment processed", {
        eventId: event.id,
        sessionId: session.id,
        reference: session.client_reference_id,
        result,
      });
      return res.status(200).json({ received: true, processed: true });
    } catch (error) {
      console.error("Erreur traitement Gala async", error);
      return res.status(500).json({
        error: "Gala fulfillment failed",
        detail: error.message,
      });
    }
  }

  // On ignore volontairement les autres événements.
  return res.status(200).json({
    received: true,
    ignored: event.type,
  });
}
