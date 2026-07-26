// Single source of truth for premium/elite gating.
// Pass the subscription object returned by useSubscription().
// When Stripe Live is enabled, only this file needs adjustment.
export function isPremium(subscription) {
  return subscription?.isActive === true;
}
