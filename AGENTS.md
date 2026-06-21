# Project Overview
This project is a web application for managing electrical service requests ("ระบบจัดการคำร้องไฟฟ้า"). It provides a comprehensive CRUD system for tracking requests, a real-time search and filtering interface, and a daily logbook feature that supports printing and PDF generation.

The application is designed to be responsive and is primarily in the Thai language for its user interface.

# Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Frontend:** React 19, Tailwind CSS v4
- **Language:** TypeScript 5 (Strict Mode)
- **Database ORM:** Prisma v7.8.0
- **Database:** PostgreSQL (`@prisma/adapter-pg`, `pg`)
- **PDF & Printing:** `@react-pdf/renderer` (Transpiled in next.config.ts), `jspdf`, `html2canvas`, `html-to-image`

# Commands
- `npm run dev` - Start the development server (Next.js)
- `npm run build` - Build the project for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push Prisma schema state to the database
- `npm run db:migrate` - Create and apply Prisma migrations
- `npm run db:studio` - Open Prisma Studio to view database records

# Coding Rules & Guidelines

## 1. Next.js 16 App Router
- **Breaking Changes:** This project uses Next.js 16. APIs, conventions, and file structures may differ from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
- Use the `app` directory for routing. API routes are defined in `app/api/.../route.ts`.
- Separate UI components into Server Components and Client Components (`"use client"`). Default to Server Components unless interactivity (hooks, state) is needed.
- Data fetching for lists and details is done through API routes (e.g., `GET /api` with parameters for pagination and filtering).

## 2. Database & Prisma
- Prisma Client is generated in `app/generated/prisma`.
- The main model is `ElectricalRequest` (mapped to `electrical_requests` table).
- Database columns use `snake_case` (e.g., `@map("request_no")`), but Prisma model fields use `camelCase` (e.g., `requestNo`). Maintain this convention when adding new fields.

## 3. Styling (Tailwind CSS 4)
- Use Tailwind CSS v4 utility classes.
- The project includes specific styling for printing. Use `@media print` in `app/globals.css` and the `print:hidden` utility class to hide elements like navigation bars and buttons when the user prints the logbook.
- Maintain the established brand design (e.g., gradient backgrounds, specific status badges colors).

## 4. TypeScript & Architecture
- Use strict TypeScript typing.
- The project uses path aliases: `@/*` resolves to `./*`.
- Form state management and advanced filtering (e.g., by location, status, dates) are handled explicitly, sending parameters to backend APIs.

## 5. Printing & Exporting
- The daily logbook (`/logbook`) relies heavily on a dual-layer print strategy: showing certain elements on screen and hiding them on print.
- When working with `@react-pdf/renderer`, ensure it remains listed in `transpilePackages` inside `next.config.ts` because it is ESM-only. Avoid adding it to `serverExternalPackages` to prevent Turbopack conflicts.

## 6. Error Handling
- **Backend (API & Prisma):** All API Routes (app/api/.../route.ts) and Server Actions must always be wrapped in try-catch blocks.
- In the event of a database error (e.g., PostgreSQL connection failure, query error, or Prisma Error Codes like P2002), never leak raw stack traces or internal database structures to the frontend.
- Always return a standardized JSON response format. For example: { success: false, message: "User-friendly Thai message", errorCode: "SPECIFIC_CODE" }, paired with the correct HTTP Status Code (e.g., 400 Bad Request, 500 Internal Server Error).
- **Frontend (UI & Notifications):** Client Components must comprehensively handle all UI states: loading, success, and error.
- When an API request fails, data cannot be fetched, or a submission errors out, provide immediate user feedback via Toast Notifications (e.g., sonner or the existing toast library) or an Alert Banner. Do not fail silently or rely solely on console.error.
- Error messages must be polite and offer a basic resolution (e.g., "ไม่สามารถโหลดข้อมูลคำร้องได้ในขณะนี้ กรุณาตรวจสอบอินเทอร์เน็ตหรือลองใหม่อีกครั้ง" - "Unable to load request data at this time. Please check your connection or try again.").