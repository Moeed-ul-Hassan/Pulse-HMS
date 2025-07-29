# Pulse HMS - Configuration Example
# Copy this file to config.py and update with your actual values

import os

class Config:
    """Base configuration class for Pulse HMS"""
    
    # Flask Configuration
    SECRET_KEY = 'your-secret-key-here'  # Change this to a secure random string
    DEBUG = True
    TESTING = False
    
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = 'sqlite:///pulse_hms.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # AI Services Configuration
    GEMINI_API_KEY = 'your-gemini-api-key-here'  # Get from https://ai.google.dev/
    OPENAI_API_KEY = 'your-openai-api-key-here'  # Optional: For additional AI features
    
    # Email Configuration (Optional)
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'your-email@gmail.com'
    MAIL_PASSWORD = 'your-app-password'
    
    # File Upload Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = 'uploads'
    
    # Security Configuration
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Application Settings
    APP_NAME = 'Pulse HMS'
    APP_VERSION = '1.0.0'
    ADMIN_EMAIL = 'admin@pulse-hms.com'
    
    # Feature Flags
    ENABLE_AI_FEATURES = True
    ENABLE_QR_CHECKIN = True
    ENABLE_NOTIFICATIONS = True
    ENABLE_ANALYTICS = True
    ENABLE_PATIENT_PORTAL = True

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///pulse_hms_dev.db'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///pulse_hms.db')
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-production-secret-key')
    SESSION_COOKIE_SECURE = True

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///pulse_hms_test.db'
    WTF_CSRF_ENABLED = False

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
} 