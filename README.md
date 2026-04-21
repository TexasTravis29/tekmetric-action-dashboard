
# Tekmetric Action Center

A live action item dashboard for auto repair shops that connects directly to Tekmetric.

## The Problem It Solves

When a repair order moves through different stages in Tekmetric — getting a label like "Waiting on Parts" or "Ready for Pickup" — that information stays buried inside Tekmetric. Your team has to actively go look for what needs attention. Further more there is no reports for this. 

This app surfaces those changes automatically, in real time, so nothing slips through the cracks, and you can track your increase of speed-of-service.

---

## How It Works

1. **Tekmetric fires a webhook** every time a repair order label changes in your shop
2. **This app receives that event** and immediately creates an action item on the dashboard
3. **Your team sees it** — RO number, label, and how long it's been sitting there
4. **Someone marks it done** once the action is taken care of
5. **Everything is logged** for reporting later and can export to excel. 

---

## What You Can Do

**Dashboard**
- See all open action items at a glance
- Know exactly which ROs need attention and what stage they're in
- Mark items as done, or reopen them if needed
- Clear everything at once when the board is clean

**Reports**
- Review completed action history
- Filter by RO number, label, or date range
- See how long ROs spent in each label on average
- Export to CSV for your own analysis

**Settings**
- Grab your webhook URL to paste into Tekmetric
- Update your email, password, or Tekmetric Shop ID

---

## The Flow in Plain English

> A car gets labeled **"Waiting on Customer Approval"** in Tekmetric →
> The app gets notified instantly →
> That RO appears on the dashboard →
> A service advisor sees it and calls the customer →
> They mark it **Done** →
> The app records how long it sat in that label →
> That data shows up in Reports

---

## Per-Shop & Secure

Every shop has just one account to keep the backend as free as possible. 
App is hosted on Vercel
Backend is maintained by Supabase using RLS and user authentication for secure data storage.