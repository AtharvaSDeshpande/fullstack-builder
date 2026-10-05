export const STANDARD_WAIVER_TEXT = `
I acknowledge that participation in physical training and exercise involves inherent risks of bodily injury. By signing this agreement, I certify that I am in suitable physical condition to engage in exercise, assume full responsibility for my participation, and release the facility host and trainer from liability for injuries arising from ordinary negligence.
`;

export function validateWaiver(clientName, clientEmail, signed) {
  if (!clientName || clientName.trim().length < 2) {
    return { valid: false, error: 'Full client legal name is required' };
  }
  if (!clientEmail || !/^\S+@\S+\.\S+$/.test(clientEmail)) {
    return { valid: false, error: 'Valid client email is required for electronic waiver copy' };
  }
  if (!signed) {
    return { valid: false, error: 'Client must agree to the liability waiver before booking' };
  }
  return { valid: true };
}
