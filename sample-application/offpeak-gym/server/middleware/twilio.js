export async function sendAccessPinSms({ phone, gymName, accessPin, sessionTime, date }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  const body = `OffPeak Gym: Access PIN for ${gymName} is ${accessPin}. Valid for session on ${date || 'today'} at ${sessionTime || 'booked time'}. Please re-rack all weights.`;

  if (!accountSid || !authToken || !fromPhone) {
    console.log(`[Twilio SMS Simulated] To: ${phone} | Body: "${body}"`);
    return { success: true, simulated: true };
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams({
      To: phone,
      From: fromPhone.startsWith('+') ? fromPhone : `+${fromPhone}`,
      Body: body,
    });

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn(`[Twilio SMS API Error]:`, data.message || data);
      return { success: false, error: data.message };
    }
    console.log(`[Twilio Live SMS Dispatched]: SID ${data.sid} to ${phone}`);
    return { success: true, sid: data.sid };
  } catch (err) {
    console.warn(`[Twilio Network Warning]:`, err.message);
    return { success: false, error: err.message };
  }
}
