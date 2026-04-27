# Deployment Guide for Render.com

This guide will help you deploy the Lease Management System (LMS) to Render.com using the configuration I prepared.

## Prerequisites
1.  **MySQL Database**: Render does NOT provide a free built-in MySQL database. You must have a MySQL database hosted elsewhere (e.g., Aiven, PlanetScale, or a VPS).
    -   *Alternative*: You can pay for a Render Disk and run MySQL in a Docker container, but using a managed database provider is easier.
2.  **GitHub Account**: Connected to the repository `saifghl/lms`.

## Step 1: Push Configuration
I have created a `render.yaml` file in your repository. Ensure you have pushed this file to GitHub:
```bash
git add render.yaml
git commit -m "Add render blueprint"
git push
```

## Step 2: Create Blueprint on Render
1.  Log in to [Render dashboard](https://dashboard.render.com).
2.  Click **New +** and select **Blueprint**.
3.  Connect your GitHub repository (`saifghl/lms`).
4.  Render will detect the `render.yaml` file and show you two services:
    -   `lms-backend` (Web Service)
    -   `lms-frontend` (Static Site)
5.  Click **Apply**.

## Step 3: Configure Environment Variables
Render will ask for the following Environment Variables during setup (or you can add them in the "Environment" tab of the Backend service later):

| Variable | Description |
| :--- | :--- |
| `DB_HOST` | Hostname of your external MySQL database |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name (e.g., `lms_db`) |

> **Note**: The frontend variable `REACT_APP_API_URL` is automatically linked in the `render.yaml` to point to your backend url.

## Step 4: Database Import
Since you have a local database with data, you need to import your schema/data to the remote database.
1.  Export your local DB: `mysqldump -u root -p lms_db > backup.sql`
2.  Import to remote DB: `mysql -h <remote_host> -u <user> -p <remote_db> < backup.sql`

## Verify Deployment
Once deployed:
1.  Open the frontend URL provided by Render (e.g., `https://lms-frontend.onrender.com`).
2.  The app should load and communicate with the backend seamlessly.
