# Student Management System (Full-Stack)

This repository contains a dual-interface student management system:
1. **C CLI**: A menu-driven command-line interface for local management.
2. **Next.js Web UI**: A modern full-stack web application for remote management.

## Features
- **Add Student**: Add new student records.
- **View All Students**: Display all stored student records.
- **Search Student**: Find a student by their ID.
- **Delete Student**: Remove a student record by their ID.
- **Data Persistence**: Records are saved in binary files (C) and JSON/Supabase (Web).

## Full-Stack Side Note
Beyond being a simple menu-driven C project, this repository implements **Full-Stack** architecture:
- **Frontend**: Built with React (Next.js) for a responsive and intuitive user experience.
- **Backend**: Utilizes Next.js Server Actions for secure, server-side business logic and API interactions.
- **Database**: Supports both local JSON persistence and cloud-based Supabase integration for real-time data synchronization.
- **Cross-Platform**: Data managed via the C interface or the Web UI remains consistent through shared data structures.

## How to Run (C)
1. Compile: `gcc student_management.c -o student_management`
2. Run: `./student_management`

## How to Run (Web)
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Access at: `http://localhost:3000`
