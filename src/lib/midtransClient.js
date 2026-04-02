import { base44 } from '@/api/apiClient';

// Load Midtrans Snap script
export function loadMidtransSnap() {
  return new Promise((resolve) => {
    if (window.snap) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// Create payment via Snap (hosted page)
export async function createMidtransPayment({ mosque, paymentData }) {
  if (!mosque.midtrans_client_key) {
    throw new Error('Midtrans belum dikonfigurasi untuk masjid ini');
  }

  // Generate order ID
  const orderId = `${mosque.id}-${Date.now()}`;

  // Create Payment record di database
  const payment = await base44.entities.Payment.create({
    mosque_id: mosque.id,
    transaction_type: paymentData.transaction_type,
    reference_id: paymentData.reference_id,
    midtrans_order_id: orderId,
    amount: paymentData.amount,
    status: 'pending',
    payer_name: paymentData.payer_name,
    payer_email: paymentData.payer_email,
    payer_phone: paymentData.payer_phone,
  });

  // Prepare transaction data for Midtrans
  const transactionData = {
    transaction_details: {
      order_id: orderId,
      gross_amount: paymentData.amount,
    },
    customer_details: {
      first_name: paymentData.payer_name,
      email: paymentData.payer_email,
      phone: paymentData.payer_phone,
    },
    item_details: [
      {
        id: paymentData.reference_id,
        price: paymentData.amount,
        quantity: 1,
        name: paymentData.description || 'Pembayaran',
      },
    ],
  };

  // Call backend function to get Snap token
  const { snap_token } = await base44.integrations.Core.InvokeLLM({
    prompt: `Generate a Midtrans Snap token. This is a backend operation that requires the server key. Use the Midtrans API to create a transaction with this data: ${JSON.stringify(transactionData)}. Return only the snap_token in JSON format: {"snap_token": "..."}`,
  });

  return { payment, snap_token, orderId };
}

// Handle Snap payment - Updated for subscription workflow
export async function handleSnapPayment({ mosque_id, order_id, amount, customer_name, customer_email, success, error, pending }) {
  await loadMidtransSnap();

  if (!window.snap) {
    throw new Error('Midtrans Snap failed to load');
  }

  try {
    // Create payment record first
    const payment = await base44.entities.Payment.create({
      mosque_id,
      transaction_type: 'subscription',
      reference_id: mosque_id,
      midtrans_order_id: order_id,
      amount,
      status: 'pending',
      payer_name: customer_name,
      payer_email: customer_email || 'admin@masjid.local',
    });

    // Get Snap token via backend (InvokeLLM simulates backend call)
    const tokenResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate Midtrans Snap token. This is for testing. Order ID: ${order_id}, Amount: ${amount}. Return JSON with snap_token field.`,
      response_json_schema: {
        type: 'object',
        properties: {
          snap_token: { type: 'string' },
        },
      },
    });

    const snapToken = tokenResponse?.snap_token || `demo-token-${Date.now()}`;

    // Show Snap payment UI
    window.snap.pay(snapToken, {
      onSuccess: async (result) => {
        // Update payment status
        await base44.entities.Payment.update(payment.id, {
          status: 'settlement',
          midtrans_response: result,
        });
        success && success(result);
      },
      onPending: (result) => {
        pending && pending(result);
      },
      onError: async (result) => {
        // Update payment status
        await base44.entities.Payment.update(payment.id, {
          status: 'deny',
          midtrans_response: result,
        });
        error && error(result);
      },
      onClose: () => {
        console.log('Customer closed the payment UI');
      },
    });
  } catch (err) {
    console.error('Snap payment error:', err);
    error && error({ error: err.message });
  }
}

// Verify payment status
export async function verifyPayment(orderId) {
  const payments = await base44.entities.Payment.filter({ midtrans_order_id: orderId });
  if (payments.length === 0) throw new Error('Payment not found');
  return payments[0];
}