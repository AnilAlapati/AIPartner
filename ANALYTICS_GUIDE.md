# VibeAI Analytics Monitoring Guide

## Overview

Your VibeAI app uses **Google Analytics 4 (GA4)** to track user behavior, engagement, and funnels. This guide shows you how to monitor key metrics.

**Measurement ID:** `G-WJ2TPBJYMD`  
**Dashboard:** [Google Analytics Console](https://analytics.google.com/)

---

## 📊 Key Metrics to Monitor

### 1. **User Acquisition & Sign-ups**

| Metric                | Where to Find                   | What It Means            |
| --------------------- | ------------------------------- | ------------------------ |
| **Total Users**       | Reports → User → Overview       | Unique users who visited |
| **New Users**         | Reports → User → Overview       | New sign-ups             |
| **User Login Events** | Reports → Events → "Auth_Login" | Users who authenticated  |
| **Active Users**      | Real-time → Overview            | Currently active users   |

**How to Check:**

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select `VibeAI` property
3. Click **Reports** → **User**
4. View "Overview" for New Users count

---

### 2. **Engagement Funnel**

Track the user journey through the app:

```
Landing Page
    ↓
Login/Auth (Auth_Login event)
    ↓
Chat Started (Chat_Started event)
    ↓
Messages Sent (Chat_Message_Sent event - track count)
    ↓
Persona Generated (Persona_Generated event)
    ↓
Matching Started (Matching_Started event)
    ↓
Matches Viewed (Matching_Match_Viewed event)
```

**How to Check:**

1. Go to **Reports** → **User Journey**
2. Look for funnel completion rates at each step
3. Identify drop-off points

---

### 3. **Chat Engagement Metrics**

| Event               | Description                     | How to Monitor                         |
| ------------------- | ------------------------------- | -------------------------------------- |
| `Chat_Started`      | User begins vibe check          | Reports → Events → "Chat_Started"      |
| `Chat_Message_Sent` | User sends a message            | Reports → Events → "Chat_Message_Sent" |
| `Chat_Completed`    | User finishes chat (5 messages) | Reports → Events → "Chat_Completed"    |

**Average Chat Engagement:**

- Count `Chat_Message_Sent` events ÷ `Chat_Started` events = **avg messages per chat**

---

### 4. **Persona & Matching Metrics**

| Event                     | Description             | How to Monitor                               |
| ------------------------- | ----------------------- | -------------------------------------------- |
| `Persona_Generated`       | User profile created    | Reports → Events → "Persona_Generated"       |
| `Matching_Started`        | Matching algorithm runs | Reports → Events → "Matching_Started"        |
| `Matching_Match_Viewed`   | User views a match card | Reports → Events → "Matching_Match_Viewed"   |
| `Matching_Match_Accepted` | User likes a match      | Reports → Events → "Matching_Match_Accepted" |
| `Matching_Match_Rejected` | User dislikes a match   | Reports → Events → "Matching_Match_Rejected" |

**Conversion Rate:**

```
(Persona_Generated / Chat_Started) × 100 = % who complete vibe check
(Matching_Started / Persona_Generated) × 100 = % who get matches
```

---

### 5. **Authentication Metrics**

| Event                 | Description        |
| --------------------- | ------------------ |
| `Auth_Login` (google) | Google OAuth login |
| `Auth_Logout`         | User logged out    |

**How to Check:**

1. Go to **Reports** → **Events** → **Auth_Login**
2. View the "google" label for Google sign-ups
3. Compare Login vs Logout events for session tracking

---

### 6. **Error Tracking**

Track any errors users encounter:

| Event     | When It Fires                                      |
| --------- | -------------------------------------------------- |
| `Error_*` | Any error in the app (chat error, API error, etc.) |

**How to Check:**

1. Go to **Reports** → **Events** → Filter for "Error\_"
2. See which errors are most common

---

## 🔍 How to Access GA4 Dashboard

### Step 1: Go to Google Analytics

Navigate to: https://analytics.google.com/

### Step 2: Select Your Property

- Choose **VibeAI** from the accounts list

### Step 3: View Real-Time Activity

- Click **Real-time** → **Overview**
- See live user sessions as they happen

### Step 4: View Reports

- Click **Reports** → **Report snapshot**
- Explore different sections:
  - **User**: Total users, new users, returning users
  - **Acquisition**: How users found your app
  - **Engagement**: Event counts and user behavior
  - **Monetization**: (N/A for now, but useful later)
  - **Retention**: User comeback rates

---

## 📈 Custom Reports to Create

### Report 1: **Daily Active Users (DAU)**

1. Reports → Create custom report
2. Dimensions: Date
3. Metrics: Active Users
4. Filter: Date range (last 30 days)

### Report 2: **User Funnel Analysis**

1. Reports → Exploration (bottom left)
2. Choose "Funnel exploration"
3. Add steps:
   - Step 1: Page path = "/" (landing page)
   - Step 2: Event = "Auth_Login"
   - Step 3: Event = "Chat_Started"
   - Step 4: Event = "Persona_Generated"
   - Step 5: Event = "Matching_Started"

### Report 3: **Match Acceptance Rate**

1. Reports → Create custom report
2. Dimensions: None (aggregate)
3. Metrics: Event count for each:
   - "Matching_Match_Accepted"
   - "Matching_Match_Viewed"
4. Calculate: Accepted ÷ Viewed = **match acceptance %**

---

## 💰 Cost Monitoring (Gemini API Spend)

Since you're tracking chat events, you can estimate API costs:

**Approx Cost Per Chat:**

- 5 messages × Gemini 3 Pro pricing = ~₹6 per user

**Budget Tracking:**

1. Monitor `Chat_Message_Sent` event count daily
2. Formula: `Chat_Message_Sent count × ₹1.20 ≈ Daily API cost`
3. Set up a **GA4 Alert** if daily events exceed your limit

### Set Up Cost Alerts:

1. Reports → Create custom alert
2. When: `Chat_Message_Sent` events > **200/day**
3. Alert you via email

---

## 🎯 Recommended KPIs to Track

| KPI                      | Target                 | Frequency |
| ------------------------ | ---------------------- | --------- |
| Daily Active Users (DAU) | Ramp up from 5→50      | Daily     |
| New Users                | Monitor signup rate    | Weekly    |
| Chat Completion Rate     | >70% finish 5 messages | Weekly    |
| Persona Generation Rate  | >80% generate profile  | Weekly    |
| Match Acceptance Rate    | >30% accept matches    | Weekly    |
| API Spend                | < ₹1000/day            | Daily     |

---

## 🚨 Alerts to Set Up

1. **Active Users > 50** → Send alert (hitting user cap)
2. **API Events > 250/day** → Approaching daily cost limit
3. **Error Rate > 5%** → Something's broken
4. **Chat Completion Rate < 50%** → Users dropping off

---

## 📱 Mobile Analytics

GA4 automatically tracks:

- Device type (mobile vs desktop)
- OS (iOS vs Android)
- Browser
- Screen resolution

**Check:**

1. Reports → Device
2. See what % of users are on mobile

---

## 🔗 Useful Links

- **GA4 Property:** https://analytics.google.com/analytics/web/?authuser=0#/p/389346245/reports/reportsnap
- **Measurement ID:** `G-WJ2TPBJYMD`
- **Firebase Console:** https://console.firebase.google.com/project/vibeaipartner/overview
- **GA4 Docs:** https://support.google.com/analytics/answer/10089681

---

## ✅ Quick Start Checklist

- [ ] Log in to Google Analytics
- [ ] Select VibeAI property
- [ ] Check Real-time dashboard
- [ ] Review Reports → User overview
- [ ] Create funnel exploration report
- [ ] Set up daily email summary
- [ ] Create cost monitoring alert
- [ ] Share dashboard link with team

---

## 📞 Support

If you don't see data:

1. Check if GA4 initialized: Open browser console, look for "Google Analytics initialized"
2. Wait 24 hours for data to appear in GA4
3. Use **Real-time** view to verify events are firing
4. Check Measurement ID matches: `G-WJ2TPBJYMD`

---

**Last Updated:** December 10, 2025  
**App URL:** https://vibeaipartner.web.app
