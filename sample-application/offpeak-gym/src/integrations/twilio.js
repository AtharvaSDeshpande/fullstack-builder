/**
 * Twilio SMS Integration Client with Sandbox Console Logger.
 */
export async function sendAccessPinSms({ phone, accessPin, gymName, sessionTime }) {
  console.log(`[Twilio SMS Dispatch] To: ${phone} | Body: "Your OffPeak Gym access PIN for ${gymName} is ${accessPin}. Valid for session at ${sessionTime}. Please re-rack all weights."`);

  return {
    success: true,
    messageId: `SM_mock_${Date.now()}`,
    status: 'delivered',
  };
}
