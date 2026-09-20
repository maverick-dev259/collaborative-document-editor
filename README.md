# CollabDocs - Collaborative Document Editor

A full-stack, real-time collaborative document editor built with the MERN stack (MongoDB, Express, React, Node.js), Socket.IO, and TipTap.

## Features

- **Real-time Collaboration**: Multiple users can edit the same document simultaneously and see changes instantly without page refreshes.
- **Rich Text Editing**: Powered by TipTap, supporting bold, italics, headings, lists, blockquotes, code blocks, alignments, and links.
- **Authentication System**: Secure JWT-based registration and login system with password hashing (bcrypt).
- **Document Management**: Create, search, sort, soft-delete, and organize documents.
- **Sharing and Permissions**: Share documents securely by email with Viewer or Editor permissions.
- **Version History**: Automatic and manual version snapshots allowing users to restore previous states of the document.
- **User Presence**: See exactly who is online and currently editing the document.
- **Auto-save**: Debounced background saving ensures your work is never lost.
- **Modern Premium UI**: Built with Tailwind CSS, featuring beautiful gradients, soft shadows, loading skeletons, and interactive animations.

## Tech Stack

**Frontend**

- React.js 18
- Vite
- Tailwind CSS 3
- TipTap Editor
- Socket.IO Client
- Axios
- React Router 6
- Lucide React (Icons)

**Backend**

- Node.js
- Express.js
- MongoDB & Mongoose
- Socket.IO (WebSockets)
- JWT & bcrypt

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas Account (or a local MongoDB instance)
- Git

### 1. Clone & Install Dependencies

First, clone the repository (or navigate to your local folder) and install dependencies for both the backend and frontend.

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

You need a MongoDB Atlas connection string. Create a `.env` file in the `server` directory.

```bash
cd server
copy .env.example .env
```

Open `server/.env` and replace `<username>` and `<password>` with your database user credentials. If you do not have a cluster, go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register), create a free tier cluster, generate a database user, and retrieve your connection string.

**Note**: Ensure your Network Access in MongoDB Atlas allows connections from all IPs (`0.0.0.0/0`) during testing.

### 3. Start the Backend Server

```bash
# Inside the /server directory
npm run dev
```

The server will start running on `http://localhost:5000`. You should see `MongoDB Connected: ...` in the console.

### 4. Start the Frontend Client

Open a **new terminal window/tab**.

```bash
# Inside the /client directory
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Testing the Application

1.  **Register/Login:** Navigate to `http://localhost:5173`. Click "Create account" to sign in.
2.  **Create a Document:** In the dashboard, click the "+ New Document" button. This will launch the text editor.
3.  **Real-Time Collaboration:**
    - Open an **Incognito window** or a different web browser.
    - Navigate to the app again and register a _second user_.
    - As User 1 (original browser window), click "Share" in the editor header, and type User 2's email. Assign them "Editor" access.
    - As User 2 (incognito), go to `Dashboard > Shared with me`. You will see the document.
    - Open it as User 2. Both users can type simultaneously. Watch the green presence indicators and real-time syncing!
4.  **Version History:** Make changes as User 1. Wait 3 seconds, or click "Save new version" in the Version History sidebar. Open Version History and click "Restore this version" on an older snippet to rollback changes safely.

---

## Deployment Instructions

- **Backend:** Can be deployed to platforms like Render, Heroku, or Railway. Ensure WebSocket (Socket.IO) upgrades are supported. Note: A production deployment would need to use Redis to sync WebSockets if scaled to multiple instances, but for a single instance, it works natively.
- **Frontend:** The output of `npm run build` in `/client` can be deployed easily to Vercel, Netlify, or GitHub Pages. Remember to update the `CLIENT_URL` in your server `.env`, and update the frontend socket/axios URLs to point to your deployed backend URL.

## Pushing to GitHub (with GitHub Desktop)

1. Open **GitHub Desktop**.
2. Click **File -> Add Local Repository** (or drag the `collaborative-document-editor` folder).
3. The app will state no git repository was found. Click **create a repository here**.
4. Set the name to "collaborative-document-editor". The `.gitignore` is already set up to exclude Node Modules and the `.env` file containing your passwords.
5. Click **Create Repository**.
6. At the top right, click **Publish repository**.
7. Keep "Keep this code private" unchecked if you want portfolio visibility, and click **Publish repository**.

---

_Created as a complete portfolio project by Antigravity_
