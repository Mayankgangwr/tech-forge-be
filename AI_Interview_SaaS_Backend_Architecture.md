# AI Interview Preparation SaaS

## Backend Architecture Documentation

**Stack: Node.js + TypeScript + MongoDB + Mongoose + JWT**

------------------------------------------------------------------------

# 1. Overview

This document defines the enterprise-level backend architecture for the
AI Interview Preparation SaaS platform.

The backend will:

-   Handle authentication and authorization
-   Manage resume uploads and AI analysis
-   Generate personalized roadmaps
-   Power AI chat coaching
-   Run mock interview evaluations
-   Track user progress
-   Manage billing and subscriptions

All APIs will be exposed under:

http://localhost:3000/api/v1/

------------------------------------------------------------------------

# 2. Core Technology Stack

## Core

-   Node.js
-   TypeScript
-   Express.js
-   MongoDB
-   Mongoose
-   JWT (Access + Refresh Tokens)

## Security & Infrastructure

-   bcrypt (password hashing)
-   cookie-parser
-   cors
-   helmet
-   rate-limiter-flexible
-   morgan
-   winston (logging)
-   dotenv

## Validation

-   zod (recommended) or joi

## File Upload

-   multer
-   Cloudinary or AWS S3

## Payments

-   Stripe

## AI Integration

-   OpenAI SDK (or other LLM provider)

------------------------------------------------------------------------

# 3. Enterprise Backend Folder Structure (Feature-Based)

    src/
    ├── app.ts
    ├── server.ts
    │
    ├── config/
    │   ├── db.ts
    │   ├── env.ts
    │   ├── logger.ts
    │   └── constants.ts
    │
    ├── modules/
    │   ├── auth/
    │   │   ├── auth.controller.ts
    │   │   ├── auth.service.ts
    │   │   ├── auth.routes.ts
    │   │   ├── auth.model.ts
    │   │   ├── auth.validation.ts
    │   │   ├── auth.types.ts
    │   │   └── index.ts
    │   │
    │   ├── user/
    │   │   ├── user.controller.ts
    │   │   ├── user.service.ts
    │   │   ├── user.routes.ts
    │   │   ├── user.model.ts
    │   │   ├── user.types.ts
    │   │   └── index.ts
    │   │
    │   ├── resume/
    │   ├── roadmap/
    │   ├── chat/
    │   ├── interview/
    │   ├── progress/
    │   └── billing/
    │
    ├── middlewares/
    │   ├── auth.middleware.ts
    │   ├── error.middleware.ts
    │   ├── validate.middleware.ts
    │   ├── rateLimiter.middleware.ts
    │   └── requirePlan.middleware.ts
    │
    ├── services/
    │   ├── ai.service.ts
    │   ├── email.service.ts
    │   ├── stripe.service.ts
    │   └── storage.service.ts
    │
    ├── repositories/
    │   └── base.repository.ts
    │
    ├── utils/
    │   ├── jwt.ts
    │   ├── hash.ts
    │   ├── apiResponse.ts
    │   ├── asyncHandler.ts
    │   └── pagination.ts
    │
    ├── loaders/
    │   └── index.ts
    │
    ├── routes/
    │   └── index.ts
    │
    ├── validators/
    │
    └── types/
        ├── global.d.ts
        └── express.d.ts

------------------------------------------------------------------------

# 4. Authentication System

## Endpoints

-   POST /auth/register
-   POST /auth/login
-   POST /auth/refresh
-   POST /auth/logout
-   GET /auth/me

## Token Strategy

-   Access Token (15 minutes)
-   Refresh Token (7 days, httpOnly cookie)

------------------------------------------------------------------------

# 5. Resume Module

## Endpoints

-   POST /resume/upload
-   GET /resume
-   DELETE /resume

------------------------------------------------------------------------

# 6. Roadmap Module

## Endpoints

-   GET /roadmap
-   POST /roadmap/generate
-   PATCH /roadmap/:id/complete

------------------------------------------------------------------------

# 7. Chat Module (AI Coach)

## Endpoints

-   GET /chat
-   POST /chat/message
-   DELETE /chat

------------------------------------------------------------------------

# 8. Mock Interview Module

## Endpoints

-   POST /interview/start
-   POST /interview/:id/answer
-   POST /interview/:id/submit
-   GET /interview/:id/result

------------------------------------------------------------------------

# 9. Billing Module

## Endpoints

-   POST /billing/create-checkout-session
-   POST /billing/webhook
-   GET /billing/subscription

------------------------------------------------------------------------

# 10. Milestone Plan

## Milestone 1 --- Core & Auth

-   Project setup
-   Database connection
-   User model
-   Register/Login
-   JWT system

## Milestone 2 --- Resume + AI

-   File upload
-   Resume parsing
-   AI insights storage

## Milestone 3 --- Roadmap + Chat

-   Roadmap generation
-   Chat persistence

## Milestone 4 --- Mock Interview Engine

-   Question generation
-   Evaluation system
-   Score calculation

## Milestone 5 --- Billing & Plan Gating

-   Stripe integration
-   Webhooks
-   Feature restriction middleware

------------------------------------------------------------------------

# Production Readiness Checklist

-   Central error handler
-   Logging (Winston)
-   Structured API responses
-   Refresh token rotation
-   MongoDB indexes
-   Rate limiting
-   Plan-based middleware
-   Environment validation
-   Docker configuration
