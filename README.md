# Doc-Connect

A doctor appointment & prescription management platform built on the MERN stack
(MongoDB · Express · React · Node). It has three role-based panels — **patient**,
**doctor**, and **admin** — requires **email verification before login**, and
ships with a polished UI including **light/dark mode** and motion.

- **Patients** find verified doctors, book appointments, track their status, and
  view prescriptions.
- **Doctors** enter their full professional profile at sign-up, then manage
  appointment requests (accept / decline / complete), keep a patient list, write
  prescriptions with medicines, and edit their profile.
- **Admins** manage every account: add, edit, verify, and delete both doctors and
  patients (along with their related records), and see platform-wide stats.

You choose your role (patient or doctor) on **both** the sign-up and the sign-in
screen.

---

## How it works at a glance

1. **Register** and choose your role — *patient* or *doctor*.
2. A **verification email** is sent to your address. You **cannot log in** until
   you click the link in that email.
3. After verifying, you land in the panel for your role.

> **No SMTP account?** The server automatically uses a free **Ethereal** test
> inbox in development and prints a **clickable preview link** for every email
> (verification, password reset) to the server console. Open that link to "receive"
> the email and click the verify button.

---

## Tech stack

| Layer     | Tech                                                        |
| --------- | ----------------------------------------------------------- |
| Frontend  | React 18, Vite, React Router, Tailwind CSS v4, Axios, lucide-react |
| Backend   | Node.js, Express, Mongoose                                   |
| Auth      | JWT, bcryptjs, hashed one-time email-verification / reset tokens |
| Email     | Nodemailer (real SMTP or auto Ethereal test inbox)          |
| Uploads   | Multer (profile photos)                                      |

---

## Prerequisites

- **Node.js** 18 or newer
- **MongoDB** — either a local install (`mongodb://127.0.0.1:27017`) or a free
  [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

## Getting started

The project has two folders: `server/` (API) and `client/` (React app). Run them
in **two terminals**.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # then open .env and adjust values
npm run seed                # optional: adds demo accounts (see below)
npm run dev                 # starts the API on http://localhost:5000
```

Open `server/.env` and set at least:

```ini
MONGO_URI=mongodb://127.0.0.1:27017/docconnect
JWT_SECRET=any_long_random_string
CLIENT_URL=http://localhost:5173
# EMAIL_* can be left blank to use the Ethereal preview inbox
```

### 2. Frontend

```bash
cd client
npm install
npm run dev                 # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the backend on port 5000,
so no extra config is needed for local development.

Now open **http://localhost:5173**.

---

## Demo accounts (after `npm run seed`)

The seed script creates **pre-verified** accounts so you can skip email
verification while exploring. All use the password **`Password123`**.

| Role    | Email             |
| ------- | ----------------- |
| Admin   | `admin@demo.com`   |
| Patient | `patient@demo.com` |
| Doctor  | `sara@demo.com`    |
| Doctor  | `ahmed@demo.com`   |
| Doctor  | `hina@demo.com`    |

> Admin accounts can't be self-registered — they're provisioned by the seed
> script (or by promoting a user directly in the database). The admin signs in
> from the normal login screen and is routed to the admin panel automatically.

To experience the **real verification flow**, register a brand-new account
instead — then check the server console for the Ethereal preview link.

---

## Using real email (optional)

To send actual emails via Gmail, create an
[App Password](https://support.google.com/accounts/answer/185833) and set in
`server/.env`:

```ini
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youraddress@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM=Doc-Connect <youraddress@gmail.com>
```

When `EMAIL_USER` is set, the app uses that SMTP server instead of Ethereal.

---

## Project structure

```
doc-connect/
├── server/                     # Express API
│   ├── config/db.js            # Mongo connection
│   ├── models/                 # User, DoctorProfile, Appointment, Prescription
│   ├── controllers/            # auth, doctor, appointment, prescription, user
│   ├── middleware/             # auth (protect/restrictTo), errors, uploads
│   ├── routes/                 # /api/v1/* route definitions
│   ├── utils/                  # jwt, email (Nodemailer), seed
│   └── server.js               # entry point
└── client/                     # React (Vite) app
    └── src/
        ├── api/client.js       # axios instance + auth interceptor
        ├── context/AuthContext.jsx
        ├── components/         # layout, shared UI, toasts
        └── pages/
            ├── auth/           # login, register, verify-email, reset
            ├── patient/        # dashboard, find doctors, appointments, prescriptions
            └── doctor/         # dashboard, appointments, patients, prescriptions, profile
```

---

## API overview

Base URL: `http://localhost:5000/api/v1`

**Auth** — `POST /auth/register`, `GET /auth/verify-email?token=`,
`POST /auth/login`, `POST /auth/resend-verification`,
`POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me`

**Doctors** — `GET /doctors` (search/filter), `GET /doctors/:id`,
`GET/PUT /doctors/me/profile`, `GET /doctors/me/stats`,
`GET /doctors/me/patients`, `GET /doctors/meta/specializations`

**Appointments** — `POST /appointments`, `GET /appointments/mine`,
`GET /appointments/patient/stats`, `DELETE /appointments/:id`,
`GET /appointments/doctor`, `PATCH /appointments/:id/status`

**Prescriptions** — `POST /prescriptions`, `GET /prescriptions/mine`,
`GET /prescriptions/doctor`

**Account** — `PUT /users/me`, `PUT /users/me/avatar`, `PUT /users/me/password`

**Admin** (admin only) — `GET /admin/stats`, `GET /admin/users?role=`,
`POST /admin/users`, `PUT /admin/users/:id`, `DELETE /admin/users/:id`

---

## Security notes

- Passwords are hashed with bcrypt; the password field is never returned by the API.
- Email-verification and password-reset tokens are random, single-use, **stored
  only as SHA-256 hashes**, and time-limited.
- Login is blocked for any account that hasn't verified its email.
- The database connection string and JWT secret live in `.env` (never committed).
```
