# Pulse HMS - Hospital Management System

## Overview

Pulse HMS is a modern, role-based Hospital Management System built with Flask, SQLAlchemy, and Bootstrap. The system provides comprehensive functionality for managing patients, appointments, medical records, and staff operations across different user roles (Admin, Doctor, Receptionist, Lab Staff). It features advanced capabilities including AI-powered patient summaries, QR code check-ins, offline functionality, and a patient-facing dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: SQLite (development) with support for PostgreSQL (production)
- **Authentication**: Flask-Login with role-based access control
- **Session Management**: Flask sessions with secure cookie handling
- **File Structure**: Modular blueprint-based organization

### Frontend Architecture
- **Template Engine**: Jinja2 templates
- **CSS Framework**: Bootstrap 5 with custom CSS
- **JavaScript**: Vanilla JS with Chart.js for visualizations
- **UI Design**: Glass morphism effects with greyish medical color palette
- **Responsive Design**: Mobile-first approach with container-fluid layouts

### Role-Based Access Control
- **Admin**: Full system access, user management, system statistics
- **Doctor**: Patient records, appointments, AI summaries, medical records
- **Receptionist**: Patient management, appointment booking, QR check-ins
- **Lab Staff**: Lab results management and reporting

## Key Components

### Authentication System (`auth.py`)
- Standard user login with username/password
- Patient access portal with phone number and access code
- Role-based redirects and session management
- Audit logging for all authentication events

### Patient Management (`models.py`)
- Comprehensive patient records with demographics
- Medical history tracking
- Appointment scheduling and management
- Lab results integration

### AI Services (`ai_services.py`)
- Google Gemini AI integration for patient summaries
- Historical data analysis for "What's Changed?" reports
- Medical record comparison and trend analysis
- Template-based mini report generation

### QR Code System (`qr_service.py`)
- Appointment QR code generation
- Check-in verification and processing
- Unique appointment identifiers with timestamps
- Static file management for QR code images

### Offline Functionality (`static/js/offline.js`)
- Local storage for appointment data
- Service worker for resource caching
- Sync queue for offline operations
- Online/offline status detection

### Audit Trail (`utils.py`)
- Comprehensive action logging
- IP address and user agent tracking
- Resource-specific audit trails
- Non-blocking audit implementation

## Data Flow

### Patient Registration Flow
1. Receptionist/Admin creates patient record
2. System generates unique patient ID
3. Patient demographics stored in database
4. Access code generated for patient portal

### Appointment Booking Flow
1. Staff creates appointment in system
2. QR code generated for check-in
3. Appointment confirmation with QR code
4. Patient checks in via QR scan
5. Status updates throughout appointment lifecycle

### Medical Record Flow
1. Doctor creates/updates medical records
2. AI analysis generates patient summaries
3. Historical comparison identifies changes
4. Printable reports generated
5. Records stored with audit trail

### Offline Operation Flow
1. Data cached in localStorage
2. Operations queued when offline
3. Background sync when online
4. Conflict resolution for data merges

## External Dependencies

### AI Services
- **Google Gemini API**: Gemini-2.5-pro model for medical summaries and analysis
- **API Key Management**: Environment variable configuration
- **Rate Limiting**: Built-in error handling for API failures

### QR Code Generation
- **qrcode Library**: Python QR code generation
- **PIL/Pillow**: Image processing and manipulation
- **Static File Serving**: Flask static file handling

### Frontend Libraries
- **Bootstrap 5**: UI components and responsive grid
- **Font Awesome**: Icon library for medical interface
- **Chart.js**: Data visualization for dashboards
- **Google Fonts**: Inter and Source Sans Pro typography

### Database
- **SQLAlchemy**: ORM with support for multiple databases
- **Flask-Migrate**: Database schema migrations
- **Connection Pooling**: Configured for production scalability

## Deployment Strategy

### Development Environment
- SQLite database for local development
- Debug mode enabled with hot reloading
- Environment variables for configuration
- Static file serving through Flask

### Production Considerations
- PostgreSQL database recommended
- Environment-based configuration
- Proxy fix middleware for reverse proxy deployment
- Session security with production secret keys
- Audit logging for compliance requirements

### Security Features
- Password hashing with Werkzeug
- Session management with Flask-Login
- Role-based access control
- CSRF protection (can be added)
- Audit trail for all user actions

### Scalability Features
- Database connection pooling
- Modular blueprint architecture
- Caching strategy for static QR codes
- Offline-first appointment booking
- Async-ready architecture foundation
