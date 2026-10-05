/**
 * Centralized Indian Rupee (INR / ₹) Currency Formatter.
 * Ensures 100% price display consistency across all screens and components.
 */

export function formatINR(amount, options = {}) {
  const num = Number(amount) || 0;
  const showDecimals = options.decimals ?? false;

  if (showDecimals) {
    return '₹' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // Format integer or clean decimal
  if (num % 1 === 0) {
    return '₹' + num.toLocaleString('en-IN');
  }

  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
