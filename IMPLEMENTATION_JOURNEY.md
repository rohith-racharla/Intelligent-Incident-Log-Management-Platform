# 🛠️ Implementation Journey: What I Learned

> _"The difference between a tutorial project and a real system is how you handle the edge cases."_

This document serves as a log of the **engineering challenges** I faced while building this platform and the specific decisions I made to solve them.

---

## 🚧 Challenge 1: The "N+1 Query" Performance Bottleneck

**The Problem**:  
Initially, my `GET /incidents` endpoint was extremely slow. I realized I was fetching an Incident, and then _looping_ through it to fetch its Logs one by one. For 50 incidents, the database was being hit 51 times!

**The Search**:  
I researched "NestJS Prisma performance optimization" and learned about the **N+1 Problem**.

**The Solution**:

- I refactored the query to **remove eager loading** of massive log datasets in the list view.
- I implemented **Pagination** (`page=1&limit=10`) using Prisma's `skip` and `take` parameters.
- **Result**: API response time dropped from ~500ms (with data) to <20ms.

---

## 🚧 Challenge 2: Handling High-Volume Ingestion

**The Problem**:  
Sending 100 logs/second crashed the DB connection pool because I was running a separate `INSERT` for every single HTTP request.

**The Solution: Batch Buffering**  
Instead of writing to the DB immediately, I implemented an **In-Memory Buffer** in `IngestionService`.

1.  Push incoming logs to a Javascript Array `[]`.
2.  Every **5 seconds** (or when buffer hits 100 items), flush the array to the DB using `prisma.createMany`.
3.  **Result**: The system can now handle **thousands of requests per second** (verified via `autocannon` benchmark) because the DB only sees one write operation every few seconds.

---

## 🚧 Challenge 3: Docker & "Works on My Machine"

**The Problem**:  
The app worked locally but failed inside Docker because the image was huge (1GB+) and the database connection kept failing.

**The Solution**:

1.  **Multi-Stage Build**: I rewrote the `Dockerfile` to have a `builder` stage (with all tools) and a `runner` stage (clean Alpine Linux). This reduced image size by **80%**.
2.  **Docker Networking**: I learned that `localhost` inside a container means _the container itself_, not my laptop. I configured `docker-compose` to let services talk to each other via the hostname `db`.

---

## 🚧 Challenge 4: Security is Hard

**The Problem**:  
I accidentally committed a `JWT_SECRET` to git in the early days.

**The Solution**:

- I moved all secrets to `.env` files and added them to `.gitignore`.
- I added a **Validation Pipe** to ensure the app _refuses to start_ if critical environment variables are missing.
- I implemented `ClassSerializerInterceptor` to automatically strip `password` fields from API responses, ensuring user credentials never leak.

---

## 🎓 Conclusion

This project taught me that **making it work** is just the first step. The real engineering happens when you make it **fast, secure, and reliable**.

I am looking forward to applying these lessons in a professional engineering team!
