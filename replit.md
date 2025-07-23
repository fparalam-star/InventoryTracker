# ITI Inventory Management System

## Overview

This is a full-stack inventory management system built with React, TypeScript, Express, and PostgreSQL. The application provides comprehensive inventory tracking capabilities with role-based access control, real-time dashboard metrics, and transaction management across multiple warehouses.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL-based session storage
- **API Design**: RESTful API with Express routes

### Database Design
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migration Strategy**: Drizzle Kit for schema migrations
- **Connection**: Neon serverless PostgreSQL driver
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`

## Key Components

### Core Entities
1. **Users**: Role-based access (admin, data_entry) with authentication
2. **Warehouses**: Physical storage locations with descriptions
3. **Categories**: Product categorization system
4. **Suppliers**: Vendor management with contact information
5. **Items**: Product catalog with SKU, categories, and stock levels
6. **Inventory**: Stock tracking across multiple warehouses
7. **Transactions**: All inventory movements (incoming, outgoing, transfers)

### Authentication System
- **Strategy**: Session-based authentication with PostgreSQL storage
- **Roles**: Admin (full access) and Data Entry (limited access)
- **Protection**: Route-based access control with role verification

### Dashboard Features
- **Real-time Metrics**: Total items, warehouses, low stock alerts, recent transactions
- **Activity Feed**: Recent inventory movements with type indicators
- **Low Stock Monitoring**: Automated alerts for items below minimum levels
- **Visual Indicators**: Color-coded transaction types and stock status

### Transaction Management
- **Incoming**: New inventory receipts from suppliers
- **Outgoing**: Internal usage and consumption tracking
- **Transfers**: Inter-warehouse inventory movements
- **Audit Trail**: Complete transaction history with timestamps

## Data Flow

### Frontend Data Flow
1. **Query Management**: TanStack Query handles all server state with automatic caching
2. **Form Handling**: React Hook Form with Zod validation schemas
3. **Real-time Updates**: Optimistic updates with query invalidation
4. **Error Handling**: Centralized error boundaries with toast notifications

### Backend Data Flow
1. **Request Processing**: Express middleware for parsing and logging
2. **Business Logic**: Service layer with database operations
3. **Data Validation**: Zod schemas for request/response validation
4. **Response Format**: Consistent JSON API responses with error handling

### Database Operations
1. **Schema Management**: Drizzle migrations with PostgreSQL dialect
2. **Query Optimization**: Typed queries with relation loading
3. **Transaction Safety**: Database transactions for complex operations
4. **Data Integrity**: Foreign key constraints and validation rules

## External Dependencies

### Production Dependencies
- **Database**: `@neondatabase/serverless` for PostgreSQL connectivity
- **ORM**: `drizzle-orm` and `drizzle-zod` for database operations
- **UI Library**: Complete Radix UI component suite
- **State Management**: `@tanstack/react-query` for server state
- **Form Management**: `react-hook-form` with `@hookform/resolvers`
- **Validation**: `zod` for schema validation
- **Session Storage**: `connect-pg-simple` for PostgreSQL sessions
- **Date Handling**: `date-fns` for date formatting and manipulation

### Development Dependencies
- **Build Tools**: Vite with React plugin and TypeScript support
- **Code Quality**: ESBuild for production bundling
- **Development**: Hot module replacement and runtime error overlay
- **Replit Integration**: Cartographer plugin for development environment

## Deployment Strategy

### Development Environment
- **Server**: Express with Vite middleware for HMR
- **Database**: Neon PostgreSQL with connection pooling
- **Asset Serving**: Vite dev server with proxy configuration
- **Environment**: NODE_ENV=development with runtime error overlay

### Production Build
- **Frontend**: Vite build with optimized bundling to `dist/public`
- **Backend**: ESBuild compilation to `dist/index.js`
- **Assets**: Static file serving from Express in production
- **Database**: Production Neon database with migrations

### Environment Configuration
- **Database URL**: Required environment variable for PostgreSQL connection
- **Session Management**: Secure session configuration with PostgreSQL storage
- **CORS**: Configured for cross-origin requests in development
- **Error Handling**: Production-ready error boundaries and logging

## User Preferences

Preferred communication style: Simple, everyday language.
Language: Full Arabic localization requested for entire application interface.

## Recent Changes

- July 23, 2025: Removed visible login credentials from login page for improved security (no longer shows admin/admin123 and dataentry/dataentry123 on screen)
- July 23, 2025: Added comprehensive Items Report showing detailed item information with category associations, stock levels, and warehouse distribution
- July 23, 2025: Completed comprehensive Arabic translation for all modal sub-forms including transaction creation and transfer forms
  - Translated all form fields, labels, placeholders, and buttons in TransactionModal and TransferModal components
  - Translated CategoryItemSelector component used within transaction forms
  - All success/error messages now display in Arabic
  - Complete Arabic localization now covers all user interface elements
- July 23, 2025: Implemented warehouse-specific data filtering for data entry users in reports and transactions
  - Data entry users only see data from their assigned warehouse in reports and transaction history
  - Admin users continue to see all data across all warehouses
  - Warehouse selector in reports page hidden for data entry users as they only see their assigned warehouse data
- July 23, 2025: Added clickable hyperlinks to dashboard metric cards for navigation
  - Warehouses card navigates to /warehouses page
  - Categories card navigates to /categories page
  - Items card navigates to /transactions page
  - Users card navigates to /users page
  - Suppliers card navigates to /suppliers page
  - Low stock items card navigates to /reports page
  - Today's transactions card navigates to /transactions page
- July 23, 2025: Implemented role-based access control restricting dashboard and categories pages to admin users only
  - Data entry users can only access warehouses, suppliers, transactions, and reports
  - Admin users have access to all features including dashboard, categories, and user management
  - Automatic redirection for data entry users who try to access restricted pages
- July 23, 2025: Removed Inventory page from sidebar navigation as it duplicated transaction functionality
- July 23, 2025: Completed full Arabic translation of entire application interface including:
  - Login page, sidebar navigation, dashboard components
  - Categories, warehouses, suppliers, transactions, and user management pages
  - All form labels, buttons, error messages, and status text
  - Recent activity descriptions and dashboard metrics
- July 23, 2025: Fixed Select component error in user creation form by replacing empty string value with "none"
- July 23, 2025: Implemented cascading dropdown functionality for transaction creation
- July 23, 2025: Added category-based item filtering with option to create new items during transactions
- July 23, 2025: Fixed Arabic text encoding in CSV exports with UTF-8 BOM support
- July 23, 2025: Updated login page logo to use provided ITI logo instead of generic Building2 icon
- July 02, 2025: Fixed transaction date validation - added z.coerce.date() to handle ISO date strings
- July 02, 2025: Fixed category CRUD operations - added missing PUT and DELETE API endpoints
- July 02, 2025: Corrected API parameter order in frontend calls (method, url, data)
- July 02, 2025: Removed SKU field from item creation form as requested
- July 02, 2025: Added mobile number and warehouse assignment fields to user management

## Changelog

Changelog:
- July 02, 2025. Initial setup