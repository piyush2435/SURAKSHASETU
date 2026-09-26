# 🛡️ SURAKSHA SETU
## Student Safety & Bus Tracking System

**Tagline:** Connecting Students, Parents & School for Safer Journeys

A Local-Storage-based web prototype for school bus safety.

---

## ⚠️ IMPORTANT

Demo only. Passwords stored in plain text in Local Storage.
NOT secure for production use.

---

## 🚀 How to Run on GitHub Pages

1. Upload all files to a GitHub repo (flat — no folders needed).
2. Go to Settings → Pages → Source: `main` branch, `/ (root)` folder.
3. Wait 1-2 minutes.
4. Open `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

---

## 🔑 Demo Credentials

| Role | User ID | Password |
|------|---------|----------|
| Parent | `parent001` | `parent123` |
| Parent | `parent002` | `parent123` |
| Parent | `parent003` | `parent123` |
| Parent | `parent004` | `parent123` |
| Parent | `parent005` | `parent123` |
| Admin | `admin001` | `admin123` |
| Driver | `driver001` | `driver123` (BUS-01) |
| Driver | `driver002` | `driver123` (BUS-02) |

**OTP:** Shown on screen after password. Demo only.

---

## ✨ Features

- OTP-verified login
- Live map on Parent, Admin, Driver
- Colored stop markers (green = picked, grey = pending)
- Shared bus simulation (all users see the same bus move)
- Fleet overview on Admin dashboard
- Bus management
- Journey history with outcomes
- **🚨 Emergency Services:** Hospital + Police notification
- **Emergency banner on login page** showing active emergencies
- Driver can call hospital/police directly from app
- Parents get notified when an emergency is raised on their child's bus

---

## ⚠️ Limitations

Local Storage only. No backend, no real GPS, no real SMS.
See README for production roadmap.