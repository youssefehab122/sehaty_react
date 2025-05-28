verifyPayment: async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}/verify-payment`);
    return response.data;
  } catch (error) {
    console.error('[API] Payment verification error:', error);
    throw error;
  }
}, 