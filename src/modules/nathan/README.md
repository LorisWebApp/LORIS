LORIS – Library Organisation and Resource Information System

Project Overview

LORIS (Library Organisation and Resource Information System) is a web-based digital library platform designed to help organisations manage, organise and access digital learning resources.

The system provides a centralised platform where organisations can manage their library materials, while users can browse, read, bookmark and manage their learning resources. It also supports offline access to downloaded materials, allowing users to continue reading when an internet connection is unavailable.

The platform is designed to support multiple organisations, with controlled access based on user roles and permissions.
Project Objectives
- Develop a centralised digital library management system.
- Allow organisations to manage their digital learning resources.
- Provide users with an accessible catalogue for discovering and reading materials.
- Support online reading and offline access to saved materials.
- Implement authentication, role-based access control and organisation management.
- Provide a rule-based chatbot to assist users with common queries.
- Ensure the system is responsive and accessible across desktop and mobile devices.

System Modules and Group Responsibilities

Group A – Authentication and Organisation Management

Responsible for user authentication, organisation registration and management, role-based access control, invitations, memberships, renewals, support tickets, notifications and activity logs.

Group B – Digital Library and Catalogue

Responsible for digital material management, file uploads, Cloudflare R2 storage integration, catalogue development, categories, material metadata, searching, filtering and material details.

Group C – User Features and Online Reading

Responsible for user dashboards, online PDF/EPUB reading, bookmarks, favourites, notes, highlights, reading progress, reading history, ratings and user profiles.

Group D – Offline Functionality and Rule-Based Chatbot

Responsible for Progressive Web App (PWA) functionality, offline material storage, IndexedDB, offline reading support, offline permission validation, synchronisation of user activity and the rule-based chatbot.
Technology Stack

- Frontend: React, TypeScript, Vite and Tailwind CSS.
- Backend: Node.js and Express.js.
- Database: PostgreSQL.
- Authentication: Supabase Auth.
- File Storage: Cloudflare R2.
- Offline Functionality: PWA, Service Workers and IndexedDB.
- Version Control: Git and GitHub.
- Deployment: Vercel and Railway.

Project Structure and Collaboration

The project is divided into four groups, with each group responsible for developing its assigned system modules.

All development work will be maintained in this central GitHub repository. Each group will work on its own branch to avoid interfering with other groups' implementations.

The repository will use the following branches:

- main – Stable and approved application code.
- develop – Integrated development code from all groups.
- group-a – Group A implementation.
- group-b – Group B implementation.
- group-c – Group C implementation.
- group-d – Group D implementation.
