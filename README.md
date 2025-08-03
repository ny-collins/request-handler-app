# Swiftel Request Handler App

## Project Description
The Swiftel Request Handler App is a comprehensive web application designed to streamline the request and decision-making process within the company Swiftel Fibre, ISP. It acts as a middleman between employees making various requests (monetary or non-monetary) and board members responsible for approving or rejecting these requests. The application features distinct user roles (Employee, Board Member, Admin) with tailored user interfaces and functionalities, ensuring efficient workflow and clear communication.

A key feature of the app is its robust decision-making mechanism for monetary requests, which requires unanimous approval from all registered board members. This ensures thorough deliberation for critical financial decisions. Admins have overarching control, including the ability to modify any decision, providing flexibility and oversight.

## Features
-   **User Authentication & Authorization:** Secure login and registration with role-based access control.
    -   New registrations default to the 'Employee' role.
    -   "Remember Me" functionality for persistent sessions.
-   **Role-Based User Interfaces:**
    -   **Employee Dashboard:** Displays personal request statistics and offers a quick request submission form.
    -   **Board Member/Admin Dashboard:** Provides general statistics on all requests, approvals, rejections, and pending items.
-   **Request Management:**
    -   Employees can create and view their requests (monetary or non-monetary).
    -   Board Members and Admins can view all employee requests.
-   **Decision Workflow:**
    -   Board members can approve or reject requests.
    -   **Unanimous Decision for Monetary Requests:** For monetary requests, all board members must unanimously approve or reject for the request status to change from 'pending'. If decisions are mixed, the status remains 'pending' for further discussion.
    -   Board members can edit their own decisions if the request status is still 'pending' or if not all board members have made a decision.
-   **Admin Overrides:** Admins have the power to modify any decision made by any board member, regardless of the request's current status.
-   **User Management (Admin Only):** Admins can view and modify user credentials (username, email, role) but cannot downgrade other admin accounts.
-   **Account Management:** Users can view and update their own account details.
-   **Notifications:** Real-time notifications for employees regarding the status of their requests.
-   **Responsive Design:** Optimized user interface for various screen sizes, including a custom dropdown filter for requests on small screens and a carousel for dashboard statistics.
-   **Password Visibility Toggle:** "View-eye" icon on password input fields for enhanced usability.
-   **Centralized Error Handling:** Robust and user-friendly error messages for API interactions and form validations.

## Tech Stack

### Frontend
-   **React:** A JavaScript library for building user interfaces.
-   **Vite:** A fast build tool that provides a lightning-fast development experience.
-   **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
-   **React Query:** For data fetching, caching, and synchronization.
-   **Axios:** Promise-based HTTP client for the browser and Node.js.
-   **React Hook Form:** For flexible and extensible forms with easy validation.
-   **React Icons:** A collection of popular icon packs.
-   **Date-fns:** A modern JavaScript date utility library.
-   **jwt-decode:** For decoding JWTs in the browser.
-   **Pure CSS:** Custom styling for a modern, sleek look.

### Backend
-   **Node.js:** JavaScript runtime built on Chrome's V8 JavaScript engine.
-   **Express.js:** Fast, unopinionated, minimalist web framework for Node.js.
-   **TypeScript:** For type-safe backend development.
-   **MySQL2:** MySQL client for Node.js, with Promise support.
-   **bcryptjs:** For hashing and comparing passwords.
-   **jsonwebtoken:** For implementing JSON Web Tokens for authentication.
-   **dotenv:** To load environment variables from a `.env` file.
-   **Zod:** TypeScript-first schema declaration and validation library.
-   **cors:** Node.js package for providing a Connect/Express middleware that can be used to enable CORS.

### Database
-   **MySQL:** A popular open-source relational database management system.

## Prerequisites
Before you begin, ensure you have the following installed on your system:
-   Node.js (LTS version recommended)
-   npm (comes with Node.js)
-   MySQL Server (version 8.0+)
-   Git

## Getting Started

Follow these steps to get your development environment set up.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd request-handler-app # Or whatever your main project folder is named
```

### 2. Backend Setup

Navigate to the backend directory:
```bash
cd swiftel-request-handler-backend
```

Install backend dependencies:
```bash
npm install
```

#### Database Setup

You need a MySQL database for the backend.

1.  **Create the Database and Tables:**
    Connect to your MySQL server (e.g., using `mysql -u your_user -p`) and run the following SQL commands to create the database and its schema:

    ```sql
    -- Create new DB
    CREATE DATABASE swiftel_request_handler_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- Select the DB
    USE swiftel_request_handler_db;

    -- Roles Table
    CREATE TABLE roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE
    ) ENGINE=InnoDB;

    -- Users Table
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE
    ) ENGINE=InnoDB;

    -- Requests Table
    CREATE TABLE requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      type ENUM('monetary', 'non-monetary') NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;

    -- Decisions Table
    CREATE TABLE decisions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT NOT NULL,
      board_member_id INT NOT NULL,
      decision ENUM('approved', 'rejected') NOT NULL,
      decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (request_id, board_member_id),
      FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (board_member_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB;

    --Notifications Table
    CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message VARCHAR(255) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

    -- Optional: Indexes for performance
    CREATE INDEX idx_user_role ON users(role_id);
    CREATE INDEX idx_request_creator ON requests(created_by);
    CREATE INDEX idx_decision_request_board ON decisions(request_id, board_member_id);
    ```

2.  **Insert Initial Data (Roles):**
    It's crucial to populate the `roles` table with the predefined roles: `employee`, `board_member`, and `admin`.

    ```sql
    INSERT INTO roles (name) VALUES ('employee'), ('board_member'), ('admin');
    ```

3.  **Create a Database User (Optional but Recommended):**
    For better security, create a dedicated user for your application and grant it privileges to your database. Replace `your_app_user` and `your_password` with strong credentials.

    ```sql
    CREATE USER 'your_app_user'@'localhost' IDENTIFIED BY 'your_password';
    GRANT ALL PRIVILEGES ON swiftel_request_handler_db.* TO 'your_app_user'@'localhost';
    FLUSH PRIVILEGES;
    ```
    *Note: If your MySQL server is on a different host, replace `localhost` with the appropriate IP address or `%` for any host (use `%` with caution in production).*

#### Environment Configuration (`.env`)

Create a `.env` file in the `swiftel-request-handler-backend` directory with the following variables. Replace the placeholder values with your actual database credentials and strong secrets.

```
PORT=5000
DB_HOST=localhost
DB_USER=your_app_user
DB_PASSWORD=your_password
DB_NAME=swiftel_request_handler_db
JWT_SECRET=your_jwt_secret_key_here_a_long_random_string
JWT_EXPIRES_IN=1h
JWT_REMEMBER_ME_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173 # Or your deployed frontend URL in production
```

#### Run the Backend

```bash
npm run dev
```
The backend server should start on `http://localhost:5000`.

### 3. Frontend Setup

Navigate to the frontend directory:
```bash
cd ../swiftel-request-handler-frontend
```

Install frontend dependencies:
```bash
npm install
```

#### Environment Configuration (`.env.development` and `.env.production`)

Create a `.env.development` file in the `swiftel-request-handler-frontend` directory:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

For production deployment, you will create a `.env.production` file with your deployed backend URL:

```
VITE_API_BASE_URL=https://your-deployed-backend-url.com/api
```

#### Run the Frontend

```bash
npm run dev
```
The frontend development server should start (usually on `http://localhost:5173`).

## Usage

1.  **Register:** Access the application through your browser and register a new employee account.
2.  **Login:** Log in with your newly created employee account.
3.  **Explore:**
    -   **Employee:** Make requests, view your dashboard statistics, and track your requests.
    -   **Board Member:** View all requests, make decisions, and see overall statistics. Monetary requests require unanimous decisions.
    -   **Admin:** Full control over user accounts and the ability to override any decision.

## Deployment

This application is designed for deployment to a VPS. Key considerations for deployment include:
-   **Environment Variables:** Configure all necessary environment variables directly on your VPS or through your chosen process manager (e.g., PM2).
-   **Process Management:** Use a process manager like PM2 to keep your Node.js backend running continuously.
-   **Web Server:** Use a web server like Nginx to serve your frontend static files and proxy requests to your backend API.
-   **CORS:** Ensure your backend's CORS configuration allows requests from your deployed frontend domain.

Detailed deployment steps for your specific VPS setup will follow.

## Contributing
Feel free to fork the repository, create a new branch, and submit pull requests.

## License
This project is licensed under the MIT License.
