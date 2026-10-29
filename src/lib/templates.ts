// Starter replies for the questions this store gets most. `{name}` becomes the customer's first name.
export const REPLY_TEMPLATES = [
  { label: 'Shipping delay', body: 'Hi {name}, I am sorry your order is running late. I have asked the carrier for an update and will email you the new delivery date within 24 hours.' },
  { label: 'Refund started', body: 'Hi {name}, your refund has been started to the original payment method. Banks usually post it within 3 to 5 business days.' },
  { label: 'Request photos', body: 'Hi {name}, I am sorry about this. Could you reply with a photo of the item and the packaging so I can arrange a replacement?' },
  { label: 'How to track', body: 'Hi {name}, you can follow your parcel with the tracking number in your shipping email. If the page does not load, tell me and I will check it for you.' },
  { label: 'Closing the loop', body: 'Hi {name}, glad we could sort this out. I will mark the ticket as resolved, and you can reply any time to reopen it.' },
] as const;

// Random lines for the demo customer, who answers on their own a few seconds after each agent reply.
export const CUSTOMER_REPLIES = [
  'Thanks for the update. Any news on this?',
  'That works for me, thank you.',
  'I still have not heard anything. Could you check again?',
  'Sorry for the slow reply. Here is the information you asked for.',
  'Great, thanks for sorting that out so quickly.',
  'Could you confirm the date again? I want to plan around it.',
  'I sent the photos to your support email just now.',
  'Hmm, that did not fix it on my side. Can we try something else?',
  'Perfect, I will keep an eye out for it. Thank you!',
  'Is there anything else you need from me?',
];
