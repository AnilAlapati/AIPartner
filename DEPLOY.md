# Deployment Guide

This project is configured for **Firebase Hosting** (Frontend) and **Firebase Cloud Functions** (Backend).

## Prerequisites

1.  **Firebase CLI**: Install it globally if you haven't already.
    ```bash
    npm install -g firebase-tools
    ```
2.  **Login**: Log in to your Firebase account.
    ```bash
    firebase login
    ```
3.  **Initialize**: If this is a fresh clone, ensure you've selected your project.
    ```bash
    firebase use --add
    ```

## Configuration

Before deploying, you must set your Gemini API key in the Firebase Functions configuration.

```bash
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"
```

## Automated Build & Deploy

You can use the included script to build both frontend and backend dependencies:

```bash
chmod +x deploy.sh
./deploy.sh
```

Then, deploy everything to Firebase:

```bash
firebase deploy
```

## Manual Steps

### 1. Build Frontend

```bash
npm install
npm run build
```

This compiles the React app to the `dist` folder.

### 2. Prepare Backend

```bash
cd functions
npm install
cd ..
```

### 3. Deploy

```bash
firebase deploy
```

## Troubleshooting

- **CORS Issues**: If you see CORS errors, ensure your domain is added to `ALLOWED_ORIGINS` in `functions/index.js`.
- **Quota Issues**: If the backend fails, check your Firebase/Google Cloud quotas.
