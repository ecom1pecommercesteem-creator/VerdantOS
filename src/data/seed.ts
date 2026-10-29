import type {
  ActivityEvent,
  Agent,
  AppData,
  Customer,
  Escalation,
  InternalNote,
  Message,
  NotificationItem,
  Order,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  WorkspaceSettings,
} from '../types';

// Starter data the workspace opens with. Customers, agents, orders and tickets are fictional.

export const customers: Customer[] = [
  { id: 'cus-01', name: 'Maya Chen', email: 'maya.chen@example.com', phone: '(555) 010-0101', city: 'Portland, OR', status: 'vip', customerSince: '2023-02-14' },
  { id: 'cus-02', name: 'Liam Patel', email: 'liam.patel@example.com', phone: '(555) 010-0102', city: 'Austin, TX', status: 'active', customerSince: '2024-06-03' },
  { id: 'cus-03', name: 'Grace Oduya', email: 'grace.oduya@example.com', phone: '(555) 010-0103', city: 'Atlanta, GA', status: 'active', customerSince: '2022-11-20' },
  { id: 'cus-04', name: 'Noah Fischer', email: 'noah.fischer@example.com', phone: '(555) 010-0104', city: 'Denver, CO', status: 'at_risk', customerSince: '2024-01-09' },
  { id: 'cus-05', name: 'Isabella Rossi', email: 'isabella.rossi@example.com', phone: '(555) 010-0105', city: 'Chicago, IL', status: 'active', customerSince: '2025-03-18' },
  { id: 'cus-06', name: 'Owen Walsh', email: 'owen.walsh@example.com', phone: '(555) 010-0106', city: 'Seattle, WA', status: 'vip', customerSince: '2021-08-27' },
  { id: 'cus-07', name: 'Amara Diallo', email: 'amara.diallo@example.com', phone: '(555) 010-0107', city: 'Brooklyn, NY', status: 'active', customerSince: '2025-09-01' },
  { id: 'cus-08', name: 'Ravi Kumar', email: 'ravi.kumar@example.com', phone: '(555) 010-0108', city: 'San Jose, CA', status: 'active', customerSince: '2024-10-12' },
  { id: 'cus-09', name: 'Chloe Dubois', email: 'chloe.dubois@example.com', phone: '(555) 010-0109', city: 'Nashville, TN', status: 'at_risk', customerSince: '2023-05-05' },
  { id: 'cus-10', name: 'Ethan Park', email: 'ethan.park@example.com', phone: '(555) 010-0110', city: 'Phoenix, AZ', status: 'active', customerSince: '2026-04-22' },
];

// SHA-256 of DEMO_PASSWORD, the password every seeded agent signs in with.
export const INITIAL_PASSWORD_HASH = '2c496b3ef618e525162f0199d8c31080ac0ab54d435904e1445e02e77e77813d';

// Shown on the sign-in page so anyone opening the demo can get in. A test keeps it in step with the hash above.
export const DEMO_PASSWORD = 'harbor-support';

export const agents: Agent[] = [
  { id: 'agt-priya', name: 'Priya Nair', role: 'Support Lead', availability: 'online', email: 'priya.nair@harborthread.example', passwordHash: INITIAL_PASSWORD_HASH },
  { id: 'agt-daniel', name: 'Daniel Okafor', role: 'Support Agent', availability: 'online', email: 'daniel.okafor@harborthread.example', passwordHash: INITIAL_PASSWORD_HASH },
  { id: 'agt-sofia', name: 'Sofia Marquez', role: 'Support Agent', availability: 'away', email: 'sofia.marquez@harborthread.example', passwordHash: INITIAL_PASSWORD_HASH },
  { id: 'agt-hana', name: 'Hana Kim', role: 'Support Agent', availability: 'offline', email: 'hana.kim@harborthread.example', passwordHash: INITIAL_PASSWORD_HASH },
];

export const developers: Agent[] = [
  { id: 'agt-sam', name: 'Sam Reyes', role: 'Developer', availability: 'online', email: 'sam.reyes@harborthread.example', passwordHash: INITIAL_PASSWORD_HASH },
  { id: 'agt-mei', name: 'Mei Tanaka', role: 'Developer', availability: 'away', email: 'mei.tanaka@harborthread.example', passwordHash: INITIAL_PASSWORD_HASH },
];

export const orders: Order[] = [
  { id: 'ORD-10482', customerId: 'cus-01', placedAt: '2026-10-18', status: 'delivered', items: [{ name: 'Walnut Cutting Board', quantity: 1, price: 64 }, { name: 'Beeswax Wrap Set', quantity: 2, price: 18 }], total: 100, carrier: 'NorthStar Parcel', trackingNumber: '1Z-NS-88213405' },
  { id: 'ORD-10517', customerId: 'cus-01', placedAt: '2026-10-24', status: 'shipped', items: [{ name: 'Stoneware Pour-Over Set', quantity: 1, price: 58 }], total: 58, carrier: 'NorthStar Parcel', trackingNumber: '1Z-NS-88230117' },
  { id: 'ORD-10455', customerId: 'cus-02', placedAt: '2026-10-08', status: 'delayed', items: [{ name: 'Canvas Weekender Bag', quantity: 1, price: 129 }], total: 129, carrier: 'Regional Express', trackingNumber: 'RX-4471902' },
  { id: 'ORD-10390', customerId: 'cus-03', placedAt: '2026-09-29', status: 'refunded', items: [{ name: 'Linen Throw (King)', quantity: 1, price: 96 }], total: 96, carrier: 'NorthStar Parcel', trackingNumber: '1Z-NS-77420981' },
  { id: 'ORD-10449', customerId: 'cus-03', placedAt: '2026-10-02', status: 'delivered', items: [{ name: 'Ceramic Mug Trio', quantity: 1, price: 42 }], total: 42, carrier: 'NorthStar Parcel', trackingNumber: '1Z-NS-79002314' },
  { id: 'ORD-10533', customerId: 'cus-04', placedAt: '2026-10-21', status: 'processing', items: [{ name: 'Merino Crew Sweater', quantity: 1, price: 84.2 }], total: 84.2 },
  { id: 'ORD-10498', customerId: 'cus-05', placedAt: '2026-10-11', status: 'delivered', items: [{ name: 'Oxford Button-Down (M)', quantity: 1, price: 72 }], total: 72, carrier: 'Regional Express', trackingNumber: 'RX-4439021' },
  { id: 'ORD-10527', customerId: 'cus-06', placedAt: '2026-10-20', status: 'shipped', items: [{ name: 'Espresso Machine Mini', quantity: 1, price: 219 }], total: 219, carrier: 'NorthStar Parcel', trackingNumber: '1Z-NS-88190473' },
  { id: 'ORD-10388', customerId: 'cus-06', placedAt: '2026-09-14', status: 'delivered', items: [{ name: 'Burr Grinder Refurb', quantity: 1, price: 149 }], total: 149, carrier: 'NorthStar Parcel', trackingNumber: '1Z-NS-75011208' },
  { id: 'ORD-10544', customerId: 'cus-07', placedAt: '2026-10-15', status: 'delivered', items: [{ name: 'Leather Card Wallet', quantity: 1, price: 38 }, { name: 'Gift Wrap', quantity: 1, price: 4 }], total: 42, carrier: 'Regional Express', trackingNumber: 'RX-4455120' },
  { id: 'ORD-10521', customerId: 'cus-08', placedAt: '2026-10-19', status: 'shipped', items: [{ name: 'Cast Iron Skillet 10in', quantity: 1, price: 56 }], total: 56, carrier: 'NorthStar Parcel', trackingNumber: '1Z-NS-88201977' },
  { id: 'ORD-10536', customerId: 'cus-09', placedAt: '2026-10-16', status: 'delivered', items: [{ name: 'Ceramic Pour Bowl', quantity: 2, price: 34 }], total: 68, carrier: 'NorthStar Parcel', trackingNumber: '1Z-NS-88175540' },
  { id: 'ORD-10511', customerId: 'cus-09', placedAt: '2026-10-05', status: 'refunded', items: [{ name: 'Glass Carafe 1L', quantity: 1, price: 27 }], total: 27 },
  { id: 'ORD-10552', customerId: 'cus-10', placedAt: '2026-10-25', status: 'processing', items: [{ name: 'Starter Plant Kit', quantity: 1, price: 49 }], total: 49 },
];

interface TicketSeed {
  id: string;
  subject: string;
  customerId: string;
  orderId?: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId: string | null;
  csat?: number; // only meaningful for resolved tickets
  // [author, minutesAgo, body] where author is 'customer' or an agent id
  thread: [string, number, string][];
  notes?: [string, number, string][];
}

// Times are minutes before the moment the seed is built.
const ticketSeeds: TicketSeed[] = [
  {
    id: 'TKT-1041', subject: 'Order arrived with a missing item', customerId: 'cus-04', orderId: 'ORD-10533',
    category: 'order_shipping', priority: 'urgent', status: 'in_progress', assigneeId: 'agt-priya',
    thread: [
      ['customer', 2880, 'The sweater came but the second box with the scarf is missing. Only one package arrived.'],
      ['agt-priya', 2800, 'Sorry about that, Noah. I can see two parcels on the order. I am checking the carrier scan history now.'],
      ['customer', 180, 'Still nothing. I need the scarf for a gift on Friday.'],
    ],
    notes: [['agt-priya', 2790, 'Carrier shows the second parcel was scanned into a hub but not delivered. Filed a trace.']],
  },
  {
    id: 'TKT-1042', subject: 'Cannot change account email address', customerId: 'cus-08', category: 'account',
    priority: 'low', status: 'open', assigneeId: null,
    thread: [['customer', 2000, 'I need to update the email on my account to my work address. The change form does not save.']],
  },
  {
    id: 'TKT-1043', subject: 'Gift card code not received', customerId: 'cus-10', category: 'payments',
    priority: 'medium', status: 'waiting_customer', assigneeId: 'agt-hana',
    thread: [
      ['customer', 1500, 'I bought a $50 gift card yesterday and never got the email with the code.'],
      ['agt-hana', 1440, 'Thanks Ethan. The gift card was issued to the address on the order. Could you check your spam folder and confirm the email you used at checkout?'],
    ],
  },
  {
    id: 'TKT-1044', subject: 'Tracking link returns 404', customerId: 'cus-07', orderId: 'ORD-10544',
    category: 'order_shipping', priority: 'medium', status: 'in_progress', assigneeId: 'agt-daniel',
    thread: [
      ['customer', 1100, 'The tracking link in my shipping email says the page does not exist.'],
      ['agt-daniel', 1060, 'Thanks for flagging. That link had a typo on our side. The correct tracking page is below, and the parcel was delivered on the 17th.'],
    ],
  },
  {
    id: 'TKT-1045', subject: 'Invoice needed for accounting', customerId: 'cus-09', category: 'other',
    priority: 'low', status: 'resolved', assigneeId: 'agt-sofia', csat: 5,
    thread: [
      ['customer', 4200, 'Could I get a PDF invoice for order ORD-10536 for my accounting records?'],
      ['agt-sofia', 4150, 'Of course, Chloe. The invoice is attached to your account under Orders. Let me know if you need a different format.'],
      ['customer', 4120, 'Perfect, thanks!'],
    ],
  },
  {
    id: 'TKT-1046', subject: 'Warranty coverage on refurbished grinder', customerId: 'cus-06', orderId: 'ORD-10388',
    category: 'product_questions', priority: 'low', status: 'resolved', assigneeId: 'agt-priya', csat: 5,
    thread: [
      ['customer', 7200, 'Does the grinder refurb include the same two-year warranty as new units?'],
      ['agt-priya', 7100, 'Refurbished units carry a one-year warranty. The motor is covered for the full twelve months from delivery.'],
    ],
  },
  {
    id: 'TKT-1047', subject: 'Wrong glaze color delivered', customerId: 'cus-03', orderId: 'ORD-10449',
    category: 'returns_refunds', priority: 'high', status: 'resolved', assigneeId: 'agt-daniel', csat: 3,
    thread: [
      ['customer', 9800, 'I ordered the blue mug set but received the green one. Can we swap?'],
      ['agt-daniel', 9700, 'Apologies, Grace. We have shipped the blue set as a replacement and sent a prepaid return label for the green set.'],
      ['customer', 9600, 'Got it, thank you.'],
    ],
  },
  {
    id: 'TKT-1048', subject: 'Payment declined but order confirmation arrived', customerId: 'cus-05', category: 'payments',
    priority: 'high', status: 'waiting_customer', assigneeId: 'agt-sofia',
    thread: [
      ['customer', 600, 'My card was declined at checkout but I got an order confirmation for the shirt. Is the order real?'],
      ['agt-sofia', 560, 'Hi Isabella, the order was placed, but our payment provider has not captured the funds. Could you confirm the card ending digits so I can check the authorization?'],
    ],
  },
  {
    id: 'TKT-1049', subject: 'Refund for damaged ceramic mug', customerId: 'cus-09', category: 'returns_refunds',
    priority: 'urgent', status: 'in_progress', assigneeId: 'agt-priya',
    thread: [
      ['customer', 230, 'Mug arrived with a chipped handle. I have photos. Please tell me what to do.'],
      ['agt-priya', 200, 'So sorry, Chloe. We will send a replacement bowl set at no charge. Please confirm the shipping address on your account is still correct.'],
      ['customer', 20, 'Same address, thanks!'],
    ],
  },
  {
    id: 'TKT-1050', subject: 'Discount code says invalid at checkout', customerId: 'cus-10', category: 'payments',
    priority: 'medium', status: 'open', assigneeId: null,
    thread: [['customer', 50, 'SPRING15 says invalid at checkout but the homepage banner says it is active.']],
  },
  {
    id: 'TKT-1051', subject: 'Change delivery address before dispatch', customerId: 'cus-06', orderId: 'ORD-10527',
    category: 'order_shipping', priority: 'high', status: 'open', assigneeId: 'agt-daniel',
    thread: [['customer', 180, 'I moved last week. Can you update the delivery address on ORD-10527 to my new apartment?']],
  },
  {
    id: 'TKT-1052', subject: 'Do linen throws come in king size?', customerId: 'cus-08', category: 'product_questions',
    priority: 'low', status: 'resolved', assigneeId: 'agt-hana', csat: 4,
    thread: [
      ['customer', 5600, 'Are the linen throws available in king size?'],
      ['agt-hana', 5500, 'Yes, the king size throw is 90 x 108 inches. It is currently in stock in all three colors.'],
    ],
  },
  {
    id: 'TKT-1053', subject: 'Order is 9 days late with no tracking movement', customerId: 'cus-02', orderId: 'ORD-10455',
    category: 'order_shipping', priority: 'high', status: 'in_progress', assigneeId: 'agt-sofia',
    thread: [
      ['customer', 1900, 'Ordered 9 days ago and tracking has not moved since the sorting facility.'],
      ['agt-sofia', 1850, 'Sorry for the delay, Liam. I am checking with the carrier now.'],
      ['agt-sofia', 750, 'I have escalated to the carrier and offered an expedited reship at no cost.'],
      ['customer', 720, 'Still nothing. I need this for a trip next week.'],
    ],
    notes: [['agt-sofia', 690, 'Reship approved by Priya. Do not refund until reship is confirmed delivered.']],
  },
  {
    id: 'TKT-1054', subject: 'Cannot log in after password reset', customerId: 'cus-07', category: 'account',
    priority: 'high', status: 'resolved', assigneeId: 'agt-hana', csat: 5,
    thread: [
      ['customer', 600, 'I reset my password but login keeps saying invalid credentials.'],
      ['agt-hana', 560, 'Thanks Amara. I sent a fresh reset link and cleared the lock on your account. Could you try an incognito window?'],
      ['customer', 480, 'It worked, thank you!'],
    ],
  },
  {
    id: 'TKT-1055', subject: 'Size chart does not match the shirt', customerId: 'cus-05', category: 'product_questions',
    priority: 'medium', status: 'open', assigneeId: null,
    thread: [['customer', 220, 'The size chart says M is 38in chest but my shirt measures 36in across the chest.']],
  },
  {
    id: 'TKT-1056', subject: 'Charged twice for the same order', customerId: 'cus-04', orderId: 'ORD-10533',
    category: 'payments', priority: 'urgent', status: 'open', assigneeId: null,
    thread: [['customer', 75, 'My bank shows two charges of $84.20 for order ORD-10533. Please fix this.']],
  },
  {
    id: 'TKT-1057', subject: 'Refund not showing after return', customerId: 'cus-03', orderId: 'ORD-10390',
    category: 'returns_refunds', priority: 'high', status: 'waiting_customer', assigneeId: 'agt-priya',
    thread: [
      ['customer', 1440, 'I shipped the return on the 14th and tracking shows it arrived. Still no refund.'],
      ['agt-priya', 1400, 'Thanks Grace. The return arrived on the 16th and the refund has been initiated to the original card. Could you confirm the card ending 4417?'],
    ],
  },
  {
    id: 'TKT-1058', subject: 'Package marked delivered but never arrived', customerId: 'cus-01', orderId: 'ORD-10482',
    category: 'order_shipping', priority: 'high', status: 'in_progress', assigneeId: 'agt-daniel',
    thread: [
      ['customer', 340, 'Tracking says delivered on Monday but there is no package at my door. I checked with the neighbors too.'],
      ['agt-daniel', 310, 'I am sorry about this, Maya. I have opened a carrier investigation and will update you within 24 hours.'],
      ['customer', 95, 'Any update? The items were a gift for Friday.'],
      ['agt-daniel', 35, 'The carrier confirmed a misroute. A replacement is scheduled and the tracking will be shared with you today.'],
    ],
    notes: [['agt-daniel', 30, 'Carrier claim CL-88213 filed. If the claim fails, offer a reship.']],
  },
  // Older resolved tickets, spread across the week so the volume chart has a realistic shape.
  {
    id: 'TKT-1059', subject: 'Promo code not applying to sale items', customerId: 'cus-02', category: 'payments',
    priority: 'low', status: 'resolved', assigneeId: 'agt-hana', csat: 4,
    thread: [['customer', 9100, 'My welcome code is rejected on anything in the sale section.'], ['agt-hana', 9000, 'Welcome codes exclude sale items. I have applied a one-time 10% credit to your account instead.']],
  },
  {
    id: 'TKT-1060', subject: 'Need to cancel order placed by mistake', customerId: 'cus-05', category: 'order_shipping',
    priority: 'medium', status: 'resolved', assigneeId: 'agt-sofia', csat: 5,
    thread: [['customer', 8900, 'I ordered the wrong size twice. Can you cancel the second order?'], ['agt-sofia', 8700, 'Done. The duplicate order is cancelled and the refund will land in 3 to 5 days.']],
  },
  {
    id: 'TKT-1061', subject: 'Zip broke on a new jacket', customerId: 'cus-07', category: 'returns_refunds',
    priority: 'high', status: 'resolved', assigneeId: 'agt-priya', csat: 4,
    thread: [['customer', 7700, 'The zip came apart on the first wear.'], ['agt-priya', 7600, 'So sorry, Amara. A replacement jacket is on its way, no return needed.']],
  },
  {
    id: 'TKT-1062', subject: 'Which charger fits the travel kettle?', customerId: 'cus-06', category: 'product_questions',
    priority: 'low', status: 'resolved', assigneeId: 'agt-daniel', csat: 5,
    thread: [['customer', 7500, 'Does the kettle work with a UK plug adapter?'], ['agt-daniel', 7400, 'It is dual voltage, so any standard adapter works.']],
  },
  {
    id: 'TKT-1063', subject: 'Unable to download digital receipt', customerId: 'cus-10', category: 'account',
    priority: 'medium', status: 'resolved', assigneeId: 'agt-hana', csat: 4,
    thread: [['customer', 7000, 'The receipt button does nothing on my phone.'], ['agt-hana', 6000, 'Fixed on our side. I also emailed the receipt to you directly.']],
  },
  {
    id: 'TKT-1064', subject: 'Parcel left with wrong neighbour', customerId: 'cus-01', category: 'order_shipping',
    priority: 'high', status: 'resolved', assigneeId: 'agt-daniel', csat: 3,
    thread: [['customer', 6300, 'Tracking says delivered to a neighbour I do not know.'], ['agt-daniel', 6200, 'The carrier retrieved it and redelivered to you this morning.']],
  },
  {
    id: 'TKT-1065', subject: 'Update billing address on subscription', customerId: 'cus-03', category: 'account',
    priority: 'low', status: 'resolved', assigneeId: 'agt-sofia', csat: 5,
    thread: [['customer', 6000, 'We moved last month. How do I change the billing address?'], ['agt-sofia', 5900, 'I have updated it for you. The next invoice will use the new address.']],
  },
  {
    id: 'TKT-1066', subject: 'Refund requested for late delivery', customerId: 'cus-08', category: 'returns_refunds',
    priority: 'medium', status: 'resolved', assigneeId: 'agt-priya', csat: 4,
    thread: [['customer', 4800, 'The order was a week late and missed the occasion. I would like a refund.'], ['agt-priya', 4700, 'Understood. Shipping costs are refunded and I added a 15% code for next time.']],
  },
  {
    id: 'TKT-1067', subject: 'Double notification emails', customerId: 'cus-04', category: 'other',
    priority: 'low', status: 'resolved', assigneeId: 'agt-hana', csat: 4,
    thread: [['customer', 4600, 'I get every shipping email twice.'], ['agt-hana', 4300, 'A duplicate subscription was the cause. It is removed now.']],
  },
  {
    id: 'TKT-1068', subject: 'Item out of stock after payment', customerId: 'cus-09', category: 'payments',
    priority: 'high', status: 'resolved', assigneeId: 'agt-sofia', csat: 4,
    thread: [['customer', 3400, 'I paid but was told the item is unavailable.'], ['agt-sofia', 3300, 'It is restocked on Thursday. I can ship then or refund you now, whichever you prefer.']],
  },
  {
    id: 'TKT-1069', subject: 'Gift receipt without prices', customerId: 'cus-02', category: 'other',
    priority: 'low', status: 'resolved', assigneeId: 'agt-daniel', csat: 5,
    thread: [['customer', 3100, 'Can you send a gift receipt that hides the prices?'], ['agt-daniel', 2700, 'Sent to your email just now.']],
  },
  {
    id: 'TKT-1070', subject: 'Wrong item in the box', customerId: 'cus-05', category: 'order_shipping',
    priority: 'medium', status: 'resolved', assigneeId: 'agt-priya', csat: 4,
    thread: [['customer', 2300, 'I received a candle instead of the diffuser.'], ['agt-priya', 2200, 'Apologies. The diffuser ships today and you can keep the candle.']],
  },
  {
    id: 'TKT-1071', subject: 'Can I add an item to a shipped order?', customerId: 'cus-07', category: 'order_shipping',
    priority: 'low', status: 'resolved', assigneeId: 'agt-hana', csat: 5,
    thread: [['customer', 1900, 'I forgot a belt. Can it join my order?'], ['agt-hana', 1800, 'The order already shipped, so I placed the belt as a new order with free shipping.']],
  },
  {
    id: 'TKT-1072', subject: 'Card saved incorrectly at checkout', customerId: 'cus-06', category: 'payments',
    priority: 'medium', status: 'resolved', assigneeId: 'agt-sofia', csat: 5,
    thread: [['customer', 900, 'The wrong card keeps showing as default.'], ['agt-sofia', 800, 'Removed the old card and set the new one as default.']],
  },
  {
    id: 'TKT-1073', subject: 'Is the oak desk assembly included?', customerId: 'cus-10', category: 'product_questions',
    priority: 'low', status: 'resolved', assigneeId: 'agt-daniel', csat: 4,
    thread: [['customer', 400, 'Does the desk need assembly, and is a service offered?'], ['agt-daniel', 300, 'It ships flat-packed with tools. Assembly service is available for $40 at checkout.']],
  },  {
    id: 'TKT-1074', subject: 'Return label did not print', customerId: 'cus-03', category: 'returns_refunds',
    priority: 'medium', status: 'resolved', assigneeId: 'agt-priya', csat: 4,
    thread: [['customer', 11300, 'The return portal gives me a blank page instead of a label.'], ['agt-priya', 11100, 'I emailed you the prepaid label as a PDF. Please drop the parcel at any NorthStar point.']],
  },
  {
    id: 'TKT-1075', subject: 'Order shows delivered but box was empty', customerId: 'cus-09', category: 'order_shipping',
    priority: 'high', status: 'resolved', assigneeId: 'agt-daniel', csat: 3,
    thread: [['customer', 12400, 'The box arrived open and one of the mugs was missing.'], ['agt-daniel', 12150, 'Sorry about that. The missing mug ships today, with signature on delivery.']],
  },
  {
    id: 'TKT-1076', subject: 'Cannot apply gift card at checkout', customerId: 'cus-05', category: 'payments',
    priority: 'medium', status: 'resolved', assigneeId: 'agt-sofia', csat: 5,
    thread: [['customer', 13600, 'My gift card balance does not show at checkout.'], ['agt-sofia', 13500, 'The card needed activating. It is live now and the full balance applies.']],
  },
  {
    id: 'TKT-1077', subject: 'Do you ship to Canada?', customerId: 'cus-08', category: 'product_questions',
    priority: 'low', status: 'resolved', assigneeId: 'agt-hana', csat: 4,
    thread: [['customer', 14800, 'Do you deliver to Toronto, and what does it cost?'], ['agt-hana', 14500, 'Yes, flat $14 shipping to Canada with delivery in 6 to 9 days.']],
  },
  {
    id: 'TKT-1078', subject: 'Wrong size sent, need exchange', customerId: 'cus-02', category: 'returns_refunds',
    priority: 'high', status: 'resolved', assigneeId: 'agt-priya', csat: 4,
    thread: [['customer', 16200, 'I ordered a large and received a medium.'], ['agt-priya', 16000, 'The large is on its way and the prepaid return label is in your inbox.']],
  },
];

function buildTicket(seed: TicketSeed, now: Date): Ticket {
  const at = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();
  // A ticket is created by its first message, so the two share a timestamp.
  const createdMin = seed.thread[0][1];
  // Thread is chronological, so the last entry is the most recent message.
  const latestMin = seed.thread[seed.thread.length - 1][1];
  const messages: Message[] = seed.thread.map(([author, min, body], index) => {
    const isAgent = author !== 'customer';
    return {
      id: `${seed.id}-msg-${index + 1}`,
      ticketId: seed.id,
      author: isAgent ? 'agent' : 'customer',
      agentId: isAgent ? author : undefined,
      body,
      createdAt: at(min),
    };
  });
  const notes: InternalNote[] = (seed.notes ?? []).map(([agentId, min, body], index) => ({
    id: `${seed.id}-note-${index + 1}`,
    ticketId: seed.id,
    agentId,
    body,
    createdAt: at(min),
  }));
  const activity: ActivityEvent[] = [
    { id: `${seed.id}-ev-created`, ticketId: seed.id, actorId: null, text: 'Ticket created from customer email', createdAt: at(createdMin) },
  ];
  if (seed.assigneeId) {
    const name = agents.find((a) => a.id === seed.assigneeId)?.name ?? 'Agent';
    activity.push({ id: `${seed.id}-ev-assigned`, ticketId: seed.id, actorId: null, text: `Assigned to ${name}`, createdAt: at(createdMin - 10) });
  }
  const resolved = seed.status === 'resolved';
  if (resolved) {
    activity.push({ id: `${seed.id}-ev-resolved`, ticketId: seed.id, actorId: seed.assigneeId, text: 'Marked as resolved', createdAt: at(latestMin) });
  }

  return {
    id: seed.id,
    subject: seed.subject,
    customerId: seed.customerId,
    orderId: seed.orderId,
    category: seed.category,
    priority: seed.priority,
    status: seed.status,
    assigneeId: seed.assigneeId,
    createdAt: at(createdMin),
    updatedAt: at(Math.min(latestMin, ...(seed.notes ?? []).map(([, m]) => m))),
    resolvedAt: resolved ? at(latestMin) : null,
    csat: resolved ? seed.csat ?? null : null,
    messages,
    notes,
    activity,
  };
}

// Escalations the workspace starts with, linked to tickets above. Times are minutes before `now`.
export function buildEscalations(now: Date = new Date()): Escalation[] {
  const at = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();
  return [
    {
      id: 'ESC-201', ticketId: 'TKT-1042', title: 'Account email change form does not save',
      description: 'Customer submits the new work email on the account page and the form resets without saving. No error is shown.',
      severity: 'medium', status: 'in_progress', assigneeId: 'agt-sam', createdById: 'agt-priya', createdAt: at(1900), updatedAt: at(300),
    },
    {
      id: 'ESC-202', ticketId: 'TKT-1044', title: 'Shipping email tracking link has a typo',
      description: 'The tracking URL in the shipping confirmation template returns a 404. Affects every order shipped with that template.',
      severity: 'high', status: 'fixed', assigneeId: 'agt-mei', createdById: 'agt-daniel', createdAt: at(1000), updatedAt: at(420),
    },
    {
      id: 'ESC-203', ticketId: 'TKT-1050', title: 'Valid discount code rejected at checkout',
      description: 'Customer enters an active code and checkout says it is invalid. Reproduces on mobile; not yet checked on desktop.',
      severity: 'high', status: 'open', assigneeId: null, createdById: 'agt-daniel', createdAt: at(45), updatedAt: at(45),
    },
  ];
}

export function buildSettings(): WorkspaceSettings {
  return {
    workspaceName: 'Harbor & Thread Support',
    companyName: 'Harbor & Thread Goods',
    supportEmail: 'help@harborthread.example',
    supportPhone: '(555) 010-0199',
    timezone: 'America/New_York',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    notifyNewTicket: true,
    notifyCustomerReply: true,
    notifySlaBreach: true,
    notifyDailyDigest: false,
  };
}

// Phrased as things that happened, so none of them goes out of date as tickets change.
function buildNotifications(now: Date): NotificationItem[] {
  const at = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();
  return [
    { id: 'ntf-1', title: 'Urgent ticket created', body: 'TKT-1056 "Charged twice for the same order" arrived from Noah Fischer.', createdAt: at(75), read: false, ticketId: 'TKT-1056' },
    { id: 'ntf-2', title: 'Customer replied', body: 'Chloe Dubois replied on TKT-1049.', createdAt: at(20), read: false, ticketId: 'TKT-1049', recipientId: 'agt-priya' },
    { id: 'ntf-3', title: 'High-priority ticket created', body: 'TKT-1051 "Change delivery address before dispatch" arrived from Owen Walsh.', createdAt: at(180), read: false, ticketId: 'TKT-1051' },
    { id: 'ntf-4', title: 'Ticket assigned to you', body: 'TKT-1058 was assigned to you.', createdAt: at(300), read: true, ticketId: 'TKT-1058', recipientId: 'agt-daniel' },
  ];
}

// Builds the starter dataset relative to the time it runs.
export function buildSeed(now: Date = new Date()): AppData {
  return {
    tickets: ticketSeeds.map((seed) => buildTicket(seed, now)),
    escalations: buildEscalations(now),
    agents: [...agents, ...developers],
    notifications: buildNotifications(now),
    settings: buildSettings(),
    seededAt: now.toISOString(),
  };
}
