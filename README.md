# Harbor & Thread Support

A customer support dashboard for a small e-commerce team, built as a frontend-only portfolio project. There is no backend: everything runs in the browser and is saved to `localStorage`.

## Try it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests for the SLA, metrics, search and reducer rules
npm run lint
npm run build
```

### Demo accounts

All accounts share one password, which is also shown on the sign-in page: `harbor-support`.

| Role | Email | What they can do |
| --- | --- | --- |
| Support Lead | `priya.nair@harborthread.example` | Everything, plus add or remove agents and change anyone's availability |
| Support Agent | `daniel.okafor@harborthread.example` | Work tickets, change their own availability |
| Developer | `sam.reyes@harborthread.example` | Pick up and update the issues support escalates |

## What is in it

- **Dashboard** with clickable counts (active, unassigned, awaiting response, past SLA), ticket volume, workload and recent activity.
- **Tickets** inbox with quick views, status tabs, filters, search by ticket, order, customer or email, reply and internal-note threads, reply templates, SLA countdowns and escalate-to-developers.
- **Customers** with ticket history, conversations and orders.
- **Developers** queue for escalated issues, with an "Assigned to me" view for developers.
- **Team** with availability, workload and add/remove for leads.
- **Analytics** with a 7 or 14 day range, comparison with the previous period, SLA and CSAT.
- **Settings** for workspace details, timezone, notifications and a **Reset demo data** button.

The sample data is generated relative to the time you first open the app, so ticket ages and "overdue" counts look current. After a day the app offers to reset it.

## Notes

- Sign-in checks a SHA-256 hash in the browser. It is demo-grade, not real security.
- "Simulate customer reply" in a ticket is a demo helper that stands in for a real customer writing back.
- Stack: React 19, React Router 7, Tailwind CSS 4, Vite, Vitest, Lucide icons.
# VerdantOS
