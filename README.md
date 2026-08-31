# Employee Management System

A small, clean prototype for employee registration, login, and profile viewing — built with Node.js, Express, and Tailwind CSS. Employee data is stored in a remote MySQL database; profile images are resolved to CloudFront URLs at read time.

## Flow

```
Landing Page -> Register -> Login -> Home -> Profile
```

## Tech Stack

- **Backend:** Node.js, Express.js, express-session (in-memory sessions), mysql2
- **Frontend:** HTML, vanilla JavaScript, Tailwind CSS (built via Tailwind CLI, not the CDN)
- **Data:** MySQL (`employees` table) accessed through a connection pool in `backend/config/db.js`
- **Images:** profile pictures upload to S3 via AWS SDK v3 (EC2 IAM role, no access keys); MySQL stores only the bare filename in `image_key` (e.g. `employee-8f31a2.png`), and the CloudFront URL is derived on read and never persisted

## Getting Started

```bash
npm install
cp .env.example .env
```

Edit `.env` and set your MySQL connection details, AWS region/bucket, and CloudFront domain:

```env
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-root-password
DB_NAME=employee_management

AWS_REGION=us-west-2
S3_BUCKET=photos-employees
CLOUDFRONT_DOMAIN=https://your-cloudfront-domain
```

No `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — on EC2 the SDK picks up the instance's IAM role automatically.

The `employees` table must already exist — see `database/migration.sql` (run it manually; nothing in the app runs migrations automatically).

```bash
npm start
```

`npm start` just runs the server — it connects to MySQL and listens. Tailwind's CSS (`frontend/css/output.css`) is pre-built and committed to the repo, so production never needs to invoke the `tailwindcss` CLI or install it.

### Local development (CSS changes)

Only needed if you're editing Tailwind classes and want live rebuilds:

```bash
npm install          # installs devDependencies too
npm run dev           # watches CSS and restarts the server on change
```

After editing markup, regenerate the committed CSS before pushing:

```bash
npm run build:css
git add frontend/css/output.css
```

### Deploying to EC2

Install only what's needed at runtime — this skips `tailwindcss`/`postcss`/`nodemon`/`concurrently` entirely, which is both faster and avoids their platform-specific optional downloads getting stuck on a small instance:

```bash
npm ci --omit=dev
pm2 restart employee-management-system   # or: pm2 start backend/server.js --name employee-management-system
```

`npm ci` (not `npm install`) uses `package-lock.json` exactly, which is faster and more reliable on constrained instances. If installs still hang or stall (common on `t2.micro`/`t3.micro` with 1GB RAM), add swap space:

```bash
sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
```

Then open **http://localhost:3000**

For auto-reload and CSS watching during development:

```bash
npm run dev
```

## Pages

| Route       | Description                          |
|-------------|---------------------------------------|
| `/`         | Landing page                          |
| `/register` | Create an employee account            |
| `/login`    | Log in                                |
| `/home`     | Personalized home page (auth required)|
| `/profile`  | Full profile view (auth required)     |

## API

| Method | Endpoint        | Description                     |
|--------|-----------------|----------------------------------|
| POST   | `/api/register` | Create a new employee account   |
| POST   | `/api/login`    | Log in with email/password      |
| POST   | `/api/logout`   | End the session                 |
| GET    | `/api/user`     | Get the current logged-in user  |
| GET    | `/api/profile`  | Get the current user's profile  |

## Sample Accounts

Registration writes rows into the `employees` table via `/api/register`; there is no pre-seeded data. Create an account through `/register` to test the flow, then log in with the same email/password.

## Project Structure

```
employee-management/
├── backend/
│   ├── server.js
│   ├── config/
│   │   └── db.js          # mysql2 connection pool
│   ├── utils/
│   │   ├── cloudfront.js  # image_key -> CloudFront URL
│   │   └── s3.js          # AWS SDK v3 upload (EC2 IAM role, no access keys)
│   ├── routes/
│   │   ├── auth.js
│   │   └── profile.js
│   ├── data/
│   │   └── users.js       # all SQL queries (parameterized)
│   └── middleware/
│       ├── auth.js
│       └── upload.js      # multer, in-memory storage
├── frontend/
│   ├── index.html, register.html, login.html, home.html, profile.html
│   ├── js/
│   └── images/
├── database/
│   └── migration.sql      # fresh-DB schema — run manually, never by the app
├── .env.example
└── package.json
```

## Images, S3, and CloudFront

- On `/api/register`, an uploaded profile picture (jpg/png/webp) is validated by `multer` (in memory, no disk write), given a unique filename that preserves its extension (e.g. `employee-8f31a2.png`), and uploaded to the `photos-employees` S3 bucket **at the bucket root** via AWS SDK v3 (`backend/utils/s3.js`). The `S3Client` takes no credentials — on EC2 it uses the instance's IAM role automatically.
- That exact filename is what's stored in `employees.image_key` — the S3 key and the MySQL value are always identical, e.g. `image_key = "2.png"`.
- On every read (`/api/user`, `/api/profile`), `backend/utils/cloudfront.js` builds `imageUrl` as `${CLOUDFRONT_DOMAIN}/${image_key}` and the API returns both fields. `imageUrl` is computed on the fly and is never written back to MySQL.
- If no picture was uploaded, `image_key` stays `NULL` and the API returns `"image_key": null, "imageUrl": null`; the frontend falls back to a local placeholder image.

## Future AWS Integration

- **Deployment:** designed to run behind an ALB across multiple EC2 instances, each with the same IAM role and pointed at the same MySQL host.
