A private, invite-only photo sharing app.
**Stack:** MongoDB Atlas · Express · React (Vite) · Node.js · Cloudinary · Nodemailer
**Hosting:** Railway (backend, free) · Vercel (frontend, free)

---

## Services to set up (all free)

| Service | What it does | Sign up |
|---------|-------------|---------|
| MongoDB Atlas | Stores users, photos metadata, invites | mongodb.com |
| Cloudinary | Stores & serves actual photo files | cloudinary.com |
| Gmail App Password | Sends invite emails | myaccount.google.com |
| Railway | Hosts the Node.js server | railway.app |
| Vercel | Hosts the React frontend | vercel.com |

---

## How it all works

```
User uploads photo
        │
        ▼
React (FormData with image file)
        │  POST /api/photos
        ▼
Express + Multer
        │  streams file bytes
        ▼
Cloudinary
  - compresses image
  - generates CDN URL
  - returns { url, public_id }
        │
        ▼
MongoDB
  saves { url, cloudinaryId, caption, uploadedBy }
        │
        ▼
Gallery page fetches /api/photos
  → gets list of { url, caption, ... }
  → renders <img src={url}> directly
  (Cloudinary URLs are CDN links — fast worldwide)
```

Note: Unlike the Supabase version, Cloudinary URLs don't expire — they're permanent CDN links.
Access control is enforced at the API level (JWT auth required to get the photo list),
not at the URL level. For extra security you can enable Cloudinary's signed URLs feature.

---

## Project structure

```
photo-share-mern/
├── server/
│   ├── index.js              # Express app entry point
│   ├── models/
│   │   ├── User.js           # Mongoose user schema
│   │   ├── Photo.js          # Photo metadata schema
│   │   └── Invite.js         # Invite token schema
│   ├── routes/
│   │   ├── auth.js           # Login, register
│   │   ├── photos.js         # Upload, list, delete
│   │   └── invites.js        # Create invite, verify token
│   ├── middleware/
│   │   └── auth.js           # JWT verification, admin check
│   └── lib/
│       ├── cloudinary.js     # Multer + Cloudinary config
│       └── mailer.js         # Nodemailer / Gmail setup
└── client/
    └── src/
        ├── App.jsx            # Routes
        ├── lib/
        │   ├── api.js         # All fetch calls
        │   └── AuthContext.jsx # User state
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── GalleryPage.jsx
        │   └── AdminPage.jsx
        └── components/
            └── NavBar.jsx
```
