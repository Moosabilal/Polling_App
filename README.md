# SpaceVote - Real-Time Polling & Chat App

SpaceVote is a real-time polling and community chat application built using Node.js, Express, Socket.IO, and a completely custom glassmorphism HTML/CSS frontend. It implements the Repository & Service pattern for a clean backend architecture.

## Features

*   **Real-Time Polling**: Vote on topics and see the votes update live for all connected users.
*   **Live Chat**: A fully functional real-time chat room integrated alongside the poll.
*   **Typing Indicators**: See when other users are actively typing in the chat.
*   **Clean Architecture**: Backend is strictly structured into Controllers, Services, and Repositories using Interfaces (TypeScript).
*   **Premium Glassmorphism UI**: Beautiful, engaging, responsive styling built with pure CSS.

## Requirements

*   Node.js (v14 or higher)
*   npm

## Getting Started

1.  **Clone or Download the repository.**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the application**:
    ```bash
    npm run dev
    ```
4.  **View the application**:
    Open two browser tabs at `http://localhost:3000` to test out the real-time features!

## Documentation

The project heavily utilizes **Clean Architecture** via TypeScript:
*   `src/database`: Holds the mock in-memory DB connection instance.
*   `src/repositories`: Data-access layer interfaces and implementations.
*   `src/services`: Business logic layer interfaces and implementations.
*   `src/controllers`: HTTP route handling logic.
*   `src/socket`: Socket.IO wrapper coordinating real-time updates and calling Services.
*   `public`: Contains the CSS/JS and static HTML files.
