import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-11-20.acacia" as any,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // In a real app, you'd check line items to know how many tokens were bought.
    // For this demo, we'll extract metadata or just return success.
    return NextResponse.json({ 
      status: session.status,
      payment_status: session.payment_status,
      // Pass back dummy token amount if not using metadata
      tokens: session.amount_total ? Math.round(session.amount_total / 100) : 10 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}