# ChatJiam - Advanced AI Assistant

ChatJiam is a sophisticated, multimodal AI assistant featuring advanced chat, image generation, lyrics search, and real-time voice communication capabilities, all presented in a sleek, modern interface.

## Features

-   **Multimodal Chat:** Engage in text-based conversations, or provide images and files for analysis.
-   **AI Image Generation:** Create images from text prompts using Imagen 4.
-   **Real-time Voice Conversation:** Speak directly with Jiam in a live, low-latency audio session.
-   **Code Mode:** A dedicated interface for writing, explaining, and optimizing code with AI-powered suggestions.
-   **Video Generation:** Create short videos from text prompts using the Veo model.
-   **Secure Authentication:** User accounts with role-based access (user, admin, super).
-   **Admin Panel:** Manage global AI persona, users, and broadcast messages to all users.

---

## Deploying to Vercel (Step-by-Step)

This project is configured for easy deployment on Vercel. Follow these steps to get your own instance running.

### 1. Prerequisites

-   You have a Vercel account.
-   You have a Google Gemini API Key.
-   Your project code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

### 2. Vercel Project Setup

1.  **Import Project:**
    -   Log in to your Vercel dashboard.
    -   Click **Add New...** > **Project**.
    -   Find and **Import** your Git repository.

2.  **Configure Project:**
    -   Vercel will automatically detect that this is a **Vite** project.
    -   It should set the **Framework Preset** to `Vite` and automatically configure the Build Command (`npm run build`) and Output Directory (`dist`). You shouldn't need to change these.

### 3. Add Environment Variable (CRITICAL STEP)

The application requires your Google Gemini API key to function. You must provide it to Vercel securely.

1.  **Find the Environment Variables Section:**
    -   In the "Configure Project" screen, expand the **Environment Variables** section.

2.  **Add the API Key:**
    -   **Name:** `API_KEY`
    -   **Value:** Paste your Google Gemini API key into the value field.
    -   Ensure the variable is enabled for all environments (Production, Preview, Development).
    -   Click **Add**.

    ![Vercel Environment Variable Setup](https://files.catbox.moe/983y17.png)

### 4. Deploy

-   Click the **Deploy** button.
-   Vercel will now build and deploy your application. Once complete, you can visit the provided URL to see your live ChatJiam instance.
