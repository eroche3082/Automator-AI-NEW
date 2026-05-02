
/**
 * Stripe Payment Links Generator for AUTOMATOR AI
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_xxx npx ts-node stripe_links.ts \
 *     --app AUTOMATOR_AI \
 *     --plans "starter=1900/mo professional=4900/mo enterprise=9900/mo" \
 *     --success https://workspace--contact2187.repl.co/success \
 *     --cancel https://workspace--contact2187.repl.co/cancel
 */

import Stripe from "stripe";
import crypto from "crypto";

// Parse command line arguments
const args = process.argv.join(" ");
const appName = /--app\s+(\S+)/.exec(args)?.[1] || "AUTOMATOR_AI";
const successUrl = /--success\s+(\S+)/.exec(args)?.[1] || "https://workspace--contact2187.repl.co/success";
const cancelUrl = /--cancel\s+(\S+)/.exec(args)?.[1] || "https://workspace--contact2187.repl.co/cancel";
const plansArg = /--plans\s+([^]+)$/.exec(args)?.[1] || "";
const planDefs = Array.from(plansArg.matchAll(/(\w+)=([0-9]+)\/(mo|yr)/g));

// Validate environment
if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY must be a LIVE key (sk_live_...)');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
  apiVersion: "2023-10-16" 
});

async function ensureProduct(name: string): Promise<Stripe.Product> {
  const search = await stripe.products.search({ 
    query: `name:"${name}" AND active:'true'` 
  });
  
  if (search.data[0]) {
    console.log(`📦 Product exists: ${search.data[0].id}`);
    return search.data[0];
  }
  
  const product = await stripe.products.create({ 
    name, 
    active: true 
  }, { 
    idempotencyKey: "prod_" + crypto.randomUUID() 
  });
  
  console.log(`✅ Product created: ${product.id}`);
  return product;
}

async function ensurePrice(
  product: string, 
  unit: number, 
  interval: "month" | "year"
): Promise<Stripe.Price> {
  const list = await stripe.prices.list({ 
    product, 
    active: true, 
    limit: 100 
  });
  
  const found = list.data.find(p => 
    p.unit_amount === unit && 
    p.recurring?.interval === interval
  );
  
  if (found) {
    console.log(`💰 Price exists: ${found.id}`);
    return found;
  }
  
  const price = await stripe.prices.create({
    product,
    currency: "usd",
    unit_amount: unit,
    recurring: { interval }
  }, { 
    idempotencyKey: "price_" + crypto.randomUUID() 
  });
  
  console.log(`✅ Price created: ${price.id}`);
  return price;
}

async function ensurePaymentLink(priceId: string): Promise<Stripe.PaymentLink> {
  // Check for existing payment link with same price
  const links = await stripe.paymentLinks.list({ limit: 100 });
  const existing = links.data.find(l => 
    l.line_items?.some(li => (li.price as any)?.id === priceId)
  );
  
  if (existing) {
    console.log(`🔗 Payment link exists: ${existing.url}`);
    return existing;
  }
  
  const plink = await stripe.paymentLinks.create({
    line_items: [{ price: priceId, quantity: 1 }],
    after_completion: { 
      type: "redirect", 
      redirect: { url: successUrl } 
    },
    metadata: { app: appName }
  }, { 
    idempotencyKey: "plink_" + crypto.randomUUID() 
  });
  
  console.log(`✅ Payment link created: ${plink.url}`);
  return plink;
}

async function validateConnectivity() {
  try {
    const account = await stripe.accounts.retrieve();
    console.log(`🏦 Stripe Account: ${account.id}`);
    console.log(`🏢 Business: ${account.business_profile?.name || 'Unknown'}`);
    console.log(`💳 Charges Enabled: ${account.charges_enabled ? '✅' : '❌'}`);
    console.log(`📋 Details Submitted: ${account.details_submitted ? '✅' : '❌'}`);
    
    if (!account.charges_enabled) {
      throw new Error('Charges not enabled on this Stripe account');
    }
    
    return account;
  } catch (error) {
    console.error('❌ Stripe connectivity failed:', error);
    process.exit(1);
  }
}

(async () => {
  console.log(`🚀 Stripe LIVE Payment Links Generator for ${appName}`);
  console.log(`📍 Success URL: ${successUrl}`);
  console.log(`📍 Cancel URL: ${cancelUrl}`);
  console.log('');

  // Validate connectivity first
  await validateConnectivity();
  console.log('');

  // Process plans
  if (planDefs.length === 0) {
    console.log('⚠️ No plans specified. Using default plans...');
    planDefs.push(
      ['', 'starter', '1900', 'mo'],
      ['', 'professional', '4900', 'mo'],
      ['', 'enterprise', '9900', 'mo']
    );
  }

  const results = [];

  for (const m of planDefs) {
    const plan = m[1];
    const cents = parseInt(m[2], 10);
    const per = m[3] === "mo" ? "month" : "year";
    
    console.log(`🔧 Processing ${plan} plan ($${cents/100}/${per})...`);
    
    const productName = `${appName} — ${plan.toUpperCase()} Subscription`;
    const product = await ensureProduct(productName);
    const price = await ensurePrice(product.id, cents, per as any);
    const plink = await ensurePaymentLink(price.id);
    
    results.push({
      plan,
      productId: product.id,
      priceId: price.id,
      url: plink.url,
      amount: cents,
      interval: per
    });
    
    console.log(`[${plan}] ✅ Complete - ${plink.url}`);
    console.log('');
  }

  // Summary
  console.log('📊 SUMMARY:');
  console.log('============');
  for (const result of results) {
    console.log(`${result.plan.toUpperCase()}: ${result.url}`);
  }

  // JSON Output
  console.log('');
  console.log('📋 JSON Output:');
  console.log(JSON.stringify({
    app: appName,
    timestamp: new Date().toISOString(),
    results
  }, null, 2));
})().catch(console.error);
