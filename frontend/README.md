# Auction Platform

A full-stack MERN (MongoDB, Express, React, Node.js) auction platform with real-time bidding capabilities.

## Prerequisites

-   Node.js (v14+ recommended)
-   MongoDB (Local or Atlas URI)
-   Git

## Installation & Setup

### 1. Backend Setup

The backend runs on port `5000` and handles API requests, database connections, and real-time sockets.

1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    -   Ensure you have a `.env` file in the `backend` folder.
    -   Verify your `MONGODB_URI` and `FRONTEND_URL`.
4.  Start the Backend Server:
    ```bash
    npm run dev
    ```
    *You should see "Server running... on port 5000" and "MongoDB Connected".*

### 2. Frontend Setup

The frontend runs on port `5173` (or `5174` if busy) and is built with Vite + React.

1.  Open a **new terminal** and navigate to the root folder (where `package.json` is located):
    ```bash
    cd "c:\Users\hp\Desktop\Auction - Copy"
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Frontend:
    ```bash
    npm run dev
    ```
    *Open the localhost link shown in the terminal (e.g., http://localhost:5173).*

## Running the Project

Always ensure **BOTH** terminals are running:
-   **Terminal 1 (Backend):** `npm run dev` (in `/backend`)
-   **Terminal 2 (Frontend):** `npm run dev` (in root)

## Troubleshooting

-   **MongoDB Connection Error:** Check your IP Whitelist in MongoDB Atlas if using a cloud database.
-   **White Screen on Frontend:** Check the console (F12) for errors. Ensure the backend is running.
