import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-01-27-preview" as any,
  typescript: true,
});

export const createCheckoutSession = async (tokens: number, amount: string, label: string) => {
  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: label,
              description: `Purchase of ${tokens} BentoMagic credits`,
            },
            unit_amount: Math.round(parseFloat(amount.replace('$', '')) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      return_url: `${window.location.origin}/payment/confirm?session_id={CHECKOUT_SESSION_ID}`,
    });

    return { clientSecret: session.client_secret };
  } catch (error: any) {
    console.error("Stripe Session Error:", error);
    throw new Error(error.message || "Failed to initialize payment.");
  }
};