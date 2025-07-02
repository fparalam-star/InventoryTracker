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

## Recent Changes

- July 02, 2025: Fixed transaction date validation - added z.coerce.date() to handle ISO date strings
- July 02, 2025: Fixed category CRUD operations - added missing PUT and DELETE API endpoints
- July 02, 2025: Corrected API parameter order in frontend calls (method, url, data)
- July 02, 2025: Removed SKU field from item creation form as requested
- July 02, 2025: Added mobile number and warehouse assignment fields to user management

## Changelog

Changelog:
- July 02, 2025. Initial setup