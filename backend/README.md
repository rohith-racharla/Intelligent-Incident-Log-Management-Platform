# � Backend API Documentation

This directory contains the source code for the NestJS API.

> **Note**: For the high-level project goals and architecture, see the [Root README](../README.md).

---

## 🏃‍♂️ Development Setup

### Option 1: Docker (Recommended)

Run the entire stack without installing Node.js/Postgres locally.

```bash
# In the project root
docker-compose up --build
```

### Option 2: Local Development

If you want to run the app natively for debugging:

1.  **Start Database Only**:
    ```bash
    docker-compose up -d db
    ```
2.  **Install Dependencies**:
    ```bash
    yarn install
    ```
3.  **Setup Database**:
    ```bash
    # Generate Prisma Client
    npx prisma generate
    # Push Schema to DB
    npx prisma db push
    ```
4.  **Run Server**:
    ```bash
    yarn start:dev
    ```

---

## 🧪 Testing & Quality

I have implemented a comprehensive testing strategy to ensuring reliability.

### 1. Unit Tests

Tests individual services and controllers with mocked dependencies.

```bash
# Ensure you are in the backend directory
cd backend
yarn test
```

### 2. End-to-End (E2E) Tests

Verifies the full flow: _User Register -> Login -> Create Incident -> Ingest Log_.
_(Requires DB running on port 5433 - handled by `docker-compose up db`)_

```bash
# Ensure DB is running (docker-compose up -d db)
cd backend
yarn test:e2e
```

### 3. Performance Benchmark

Demonstrates the high-throughput capabilities using `autocannon`.

```bash
# From the backend directory
node scripts/benchmark.js
```

#### 📊 How to Interpret Results

You will see different results based on the **Rate Limiter** configuration in `.env`.

| Scenario                        | Config (`.env`)       | Result                      | Interpretation                                                                                               |
| :------------------------------ | :-------------------- | :-------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **A. Security Check** (Default) | `THROTTLE_LIMIT=10`   | **High Failure Rate (429)** | ✅ **SUCCESS**. Use this to prove to recruiters that your API is protected from DDoS attacks.                |
| **B. Stress Test** (Raw Power)  | `THROTTLE_LIMIT=1000` | **High RPS (~800+)**        | ✅ **SUCCESS**. Use this to prove the system can ingest thousands of logs per second using Batch Processing. |

### 4. Interactive Demo (Recruiter Friendly)

Want to see the system in action? Run the demo scenario script.
It simulates:

1.  **User Registration & Login** (Gets JWT Token)
2.  **Traffic Simulation** (Sends normal logs)
3.  **Incident Trigger** (Bursts 15 error logs to trigger detection)
4.  **Automated Response** (Verifies an Incident was created)

```bash
# Install dependencies first (if not done)
yarn install

# Run the demo
yarn demo
```

---

## 📚 API Endpoints

Full interactive documentation is available at **`/api`** (Swagger UI).

### Key Endpoints:

- **Auth**: `POST /auth/login`, `POST /users`
- **Incidents**: `GET /incidents` (Paginated), `POST /incidents`
- **Ingestion**: `POST /ingest` (Optimized for high volume)

---

## � Folder Structure

- **`src/ingestion`**: Handles log streams. Implements **Batch Buffering** to reduce DB writes.
- **`src/incidents`**: Incident management. Includes **Pagination** logic.
- **`src/common`**: Global filters (Error handling), Guards (Auth), and Interceptors.
- **`prisma/`**: Database schema and migrations.
- **`test/`**: E2E test suites.
