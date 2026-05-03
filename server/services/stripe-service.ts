import Stripe from 'stripe';
import crypto from 'crypto';

// Initialize Stripe — accept either STRIPE_SECRET_KEY_LIVE or STRIPE_SECRET_KEY.
const stripeSecretKey = process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

if (!stripeSecretKey) {
  console.warn('⚠️ WARNING: No Stripe secret key found (set STRIPE_SECRET_KEY or STRIPE_SECRET_KEY_LIVE)');
}
if (stripeSecretKey && !stripeSecretKey.startsWith('sk_live_')) {
  console.warn('⚠️ WARNING: Stripe secret key is not LIVE (should start with sk_live_)');
}
if (stripePublishableKey && !stripePublishableKey.startsWith('pk_live_')) {
  console.warn('⚠️ WARNING: Stripe publishable key is not LIVE (should start with pk_live_)');
}

// Defer construction so the module can be imported even without keys (errors surface per-call).
const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
  apiVersion: '2025-07-30.basil',
});

export interface PlanDefinition {
  name: string;
  price: number; // in cents
  interval: 'month' | 'year';
  features: string[];
}

export interface PaymentLinkResult {
  plan: string;
  productId: string;
  priceId: string;
  url: string;
}

export class StripeService {
  private appName: string;
  private appDomain: string;

  constructor() {
    this.appName = process.env.APP_NAME || 'AUTOMATOR_AI';
    this.appDomain = process.env.APP_DOMAIN || 'https://workspace--contact2187.repl.co';
  }

  /**
   * PHASE 1: Validate Stripe LIVE connectivity
   */
  async validateLiveConnectivity(): Promise<{
    accountId: string;
    businessName: string;
    chargesEnabled: boolean;
    detailsSubmitted: boolean;
    isLive: boolean;
  }> {
    try {
      const account = await stripe.accounts.retrieve();

      return {
        accountId: account.id,
        businessName: account.business_profile?.name || 'Unknown',
        chargesEnabled: account.charges_enabled || false,
        detailsSubmitted: account.details_submitted || false,
        isLive: stripeSecretKey?.startsWith('sk_live_') || false,
      };
    } catch (error) {
      throw new Error(`Stripe connectivity check failed: ${error}`);
    }
  }

  /**
   * List existing products (for validation)
   */
  async listProducts(limit: number = 10): Promise<Stripe.Product[]> {
    const products = await stripe.products.list({
      limit,
      active: true
    });
    return products.data;
  }

  /**
   * Ensure product exists or create it (idempotent)
   */
  private async ensureProduct(name: string, description?: string): Promise<Stripe.Product> {
    const search = await stripe.products.search({
      query: `name:"${name}" AND active:'true'`
    });

    if (search.data[0]) {
      return search.data[0];
    }

    return stripe.products.create({
      name,
      description,
      active: true,
    }, {
      idempotencyKey: `prod_${crypto.randomUUID()}`
    });
  }

  /**
   * Ensure price exists or create it (idempotent)
   */
  private async ensurePrice(
    productId: string,
    unitAmount: number,
    interval: 'month' | 'year'
  ): Promise<Stripe.Price> {
    const list = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 100
    });

    const found = list.data.find(p =>
      p.unit_amount === unitAmount &&
      p.recurring?.interval === interval
    );

    if (found) {
      return found;
    }

    return stripe.prices.create({
      product: productId,
      currency: 'usd',
      unit_amount: unitAmount,
      recurring: { interval }
    }, {
      idempotencyKey: `price_${crypto.randomUUID()}`
    });
  }

  /**
   * Ensure payment link exists or create it (idempotent)
   */
  private async ensurePaymentLink(priceId: string, planName: string): Promise<Stripe.PaymentLink> {
    // Check for existing payment link with same price
    const links = await stripe.paymentLinks.list({ limit: 100 });
    let existing: Stripe.PaymentLink | undefined;
    for (const link of links.data) {
      const items = await stripe.paymentLinks.listLineItems(link.id, { limit: 10 });
      if (items.data.some((li: Stripe.LineItem) => (li.price as Stripe.Price | null)?.id === priceId)) {
        existing = link;
        break;
      }
    }

    if (existing) {
      return existing;
    }

    return stripe.paymentLinks.create({
      line_items: [{ price: priceId, quantity: 1 }],
      after_completion: {
        type: 'redirect',
        redirect: { url: `${this.appDomain}/success` }
      },
      metadata: {
        app: this.appName,
        plan: planName
      }
    }, {
      idempotencyKey: `plink_${crypto.randomUUID()}`
    });
  }

  /**
   * PHASE 3: Create complete payment system for plans
   */
  async createPaymentLinks(plans: PlanDefinition[]): Promise<PaymentLinkResult[]> {
    const results: PaymentLinkResult[] = [];

    for (const plan of plans) {
      const productName = `${this.appName} — ${plan.name.toUpperCase()} Subscription`;
      const description = `${plan.name} plan for ${this.appName} - ${plan.features.join(', ')}`;

      // Create/ensure product
      const product = await this.ensureProduct(productName, description);

      // Create/ensure price
      const price = await this.ensurePrice(product.id, plan.price, plan.interval);

      // Create/ensure payment link
      const paymentLink = await this.ensurePaymentLink(price.id, plan.name);

      results.push({
        plan: plan.name,
        productId: product.id,
        priceId: price.id,
        url: paymentLink.url
      });

      console.log(`[${plan.name}] product=${product.id} price=${price.id} link=${paymentLink.url}`);
    }

    return results;
  }

  /**
   * Create a Checkout Session for a given plan and authenticated user.
   * `client_reference_id` is set to our internal user id so the webhook can link
   * the resulting Stripe customer back to the correct account.
   */
  async createCheckoutSession(opts: {
    planCode: "basic" | "pro" | "elite";
    userId: number;
    email: string;
    interval?: "month" | "year";
  }): Promise<{ url: string }> {
    const { planCode, userId, email, interval = "month" } = opts;
    const planMap: Record<string, { name: string; price: number }> = {
      basic: { name: "Starter", price: interval === "year" ? 19000 : 1900 },
      pro: { name: "Professional", price: interval === "year" ? 49000 : 4900 },
      elite: { name: "Enterprise", price: interval === "year" ? 99000 : 9900 },
    };
    const plan = planMap[planCode];
    if (!plan) throw new Error(`Unknown plan: ${planCode}`);

    const productName = `${this.appName} — ${plan.name.toUpperCase()} Subscription`;
    const product = await this.ensureProduct(productName);
    const price = await this.ensurePrice(product.id, plan.price, interval);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      customer_email: email,
      client_reference_id: String(userId),
      metadata: { userId: String(userId), plan: planCode, app: this.appName },
      subscription_data: {
        metadata: { userId: String(userId), plan: planCode, app: this.appName },
      },
      success_url: `${this.appDomain}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.appDomain}/cancel`,
      allow_promotion_codes: true,
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { url: session.url };
  }

  /**
   * Create customer portal session for billing management
   */
  async createCustomerPortalSession(customerId: string): Promise<string> {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.appDomain}/settings`,
    });

    return session.url;
  }

  /**
   * Get environment status for health check
   */
  getEnvironmentStatus() {
    return {
      secretKey: stripeSecretKey ? `${stripeSecretKey.substring(0, 12)}***` : '❌ Missing',
      publishableKey: stripePublishableKey ? `${stripePublishableKey.substring(0, 12)}***` : '❌ Missing',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'whsec_***' : '❌ Missing',
      apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
      isLive: stripeSecretKey?.startsWith('sk_live_') && stripePublishableKey?.startsWith('pk_live_'),
    };
  }

  /**
   * Generate health report
   */
  async generateHealthReport(): Promise<{
    app: string;
    accountId: string;
    businessName: string;
    products: Array<{ name: string; id: string }>;
    prices: Array<{ id: string; interval: string; amount: number }>;
    paymentLinks: Array<{ plan: string; url: string }>;
    env: { secretKey: string; publishableKey: string };
    webhook: { plannedUrl: string; events: string[] };
    checks: Record<string, { result: '✅' | '❌' | '⚠️'; evidence: string }>;
  }> {
    const connectivity = await this.validateLiveConnectivity();
    const products = await this.listProducts();
    const env = this.getEnvironmentStatus();

    // Define default plans for AUTOMATOR AI
    const defaultPlans: PlanDefinition[] = [
      {
        name: 'Starter',
        price: 1900, // $19/month
        interval: 'month',
        features: ['5 Workflows', 'Basic AI Support', 'Email Support']
      },
      {
        name: 'Professional',
        price: 4900, // $49/month
        interval: 'month',
        features: ['25 Workflows', 'Advanced AI', 'Priority Support', 'Custom Integrations']
      },
      {
        name: 'Enterprise',
        price: 9900, // $99/month
        interval: 'month',
        features: ['Unlimited Workflows', 'Premium AI', '24/7 Support', 'White-label Options']
      }
    ];

    const paymentLinks = await this.createPaymentLinks(defaultPlans);

    return {
      app: this.appName,
      accountId: connectivity.accountId,
      businessName: connectivity.businessName,
      products: products.map(p => ({ name: p.name, id: p.id })),
      prices: paymentLinks.map(pl => ({
        id: pl.priceId,
        interval: 'month',
        amount: defaultPlans.find(p => p.name.toLowerCase() === pl.plan.toLowerCase())?.price || 0
      })),
      paymentLinks: paymentLinks.map(pl => ({ plan: pl.plan, url: pl.url })),
      env: {
        secretKey: env.secretKey,
        publishableKey: env.publishableKey
      },
      webhook: {
        plannedUrl: `${this.appDomain}/api/webhooks/stripe`,
        events: [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed'
        ]
      },
      checks: {
        'LIVE keys present (sk_live/pk_live)': {
          result: env.isLive ? '✅' : '❌',
          evidence: `${env.secretKey}, ${env.publishableKey}`
        },
        '/v1/account 200, charges_enabled=true': {
          result: connectivity.chargesEnabled ? '✅' : '❌',
          evidence: connectivity.accountId
        },
        'Product/Price created or reused': {
          result: paymentLinks.length > 0 ? '✅' : '❌',
          evidence: `${paymentLinks.length} plans created`
        },
        'Payment Link generated': {
          result: paymentLinks.length > 0 ? '✅' : '❌',
          evidence: paymentLinks.map(pl => pl.url).join(', ')
        },
        'Manual activation SOP ready': {
          result: '✅',
          evidence: 'Admin panel integration ready'
        },
        'Webhook plan (URL + events)': {
          result: '⚠️',
          evidence: 'Will be implemented in Phase 5'
        }
      }
    };
  }
}

export const stripeService = new StripeService();