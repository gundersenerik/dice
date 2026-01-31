export const COMMUNICATION_TYPES = [
  { id: 'winback', name: 'Winback', description: 'Re-engage churned or inactive users' },
  { id: 'holdback', name: 'Holdback', description: 'Retain users showing signs of leaving' },
  { id: 'onboarding', name: 'Onboarding', description: 'Welcome and guide new users' },
  { id: 'engagement', name: 'Engagement', description: 'Drive active user participation' },
  { id: 'upsell', name: 'Upsell', description: 'Promote premium features or upgrades' },
  { id: 'newsletter', name: 'Newsletter', description: 'Regular content updates' },
  { id: 'breaking', name: 'Breaking News', description: 'Urgent news alerts' },
  { id: 'promotional', name: 'Promotional', description: 'Special offers and campaigns' },
  // Add more types as needed
] as const;

export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];
export type CommunicationTypeId = CommunicationType['id'];

export function getCommunicationTypeById(id: string): CommunicationType | undefined {
  return COMMUNICATION_TYPES.find((type) => type.id === id);
}
