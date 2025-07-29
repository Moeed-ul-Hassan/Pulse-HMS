from datetime import datetime, timedelta
import json
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)
    description = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    users = db.relationship('User', backref='role', lazy='dynamic')

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    first_name = db.Column(db.String(64), nullable=False)
    last_name = db.Column(db.String(64), nullable=False)
    phone = db.Column(db.String(20))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    created_appointments = db.relationship('Appointment', foreign_keys='Appointment.created_by_id', backref='created_by', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def has_role(self, role_name):
        return self.role.name == role_name if self.role else False

class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.String(20), unique=True, nullable=False)
    first_name = db.Column(db.String(64), nullable=False)
    last_name = db.Column(db.String(64), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(10))
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120))
    address = db.Column(db.Text)
    emergency_contact = db.Column(db.String(64))
    emergency_phone = db.Column(db.String(20))
    blood_type = db.Column(db.String(5))
    allergies = db.Column(db.Text)
    medical_history = db.Column(db.JSON)  # Flexible JSON storage for complex medical data
    insurance_info = db.Column(db.JSON)
    access_code = db.Column(db.String(10), unique=True)  # For patient dashboard access
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    appointments = db.relationship('Appointment', backref='patient', lazy='dynamic')
    medical_records = db.relationship('MedicalRecord', backref='patient', lazy='dynamic')
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self):
        today = datetime.utcnow().date()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))
    
    def generate_access_code(self):
        import random
        import string
        self.access_code = ''.join(random.choices(string.digits, k=6))
        return self.access_code

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.String(20), unique=True, nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    appointment_date = db.Column(db.DateTime, nullable=False)
    duration = db.Column(db.Integer, default=30)  # minutes
    type = db.Column(db.String(50))  # consultation, follow-up, emergency, etc.
    status = db.Column(db.String(20), default='scheduled')  # scheduled, arrived, in_progress, completed, cancelled
    reason = db.Column(db.Text)
    notes = db.Column(db.Text)
    qr_code = db.Column(db.String(256))  # Path to QR code image
    qr_data = db.Column(db.Text)  # QR code data for verification
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    checked_in_at = db.Column(db.DateTime)
    
    # Offline sync support
    sync_status = db.Column(db.String(20), default='synced')  # synced, pending, conflict
    offline_data = db.Column(db.JSON)
    
    doctor = db.relationship('User', foreign_keys=[doctor_id], backref='doctor_appointments')

class MedicalRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointment.id'))
    doctor_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    record_date = db.Column(db.DateTime, default=datetime.utcnow)
    chief_complaint = db.Column(db.Text)
    symptoms = db.Column(db.JSON)  # Flexible symptoms data
    vital_signs = db.Column(db.JSON)  # BP, temperature, pulse, etc.
    diagnosis = db.Column(db.Text)
    treatment_plan = db.Column(db.Text)
    prescriptions = db.Column(db.JSON)
    lab_orders = db.Column(db.JSON)
    follow_up_date = db.Column(db.Date)
    ai_summary = db.Column(db.Text)  # AI-generated summary of changes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    appointment = db.relationship('Appointment', backref='medical_record', uselist=False)
    doctor = db.relationship('User', backref='medical_records')

class LabResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    test_name = db.Column(db.String(128), nullable=False)
    test_date = db.Column(db.DateTime, default=datetime.utcnow)
    results = db.Column(db.JSON)  # Flexible test results
    reference_ranges = db.Column(db.JSON)
    status = db.Column(db.String(20), default='pending')  # pending, completed, reviewed
    technician_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    reviewed_by_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    technician = db.relationship('User', foreign_keys=[technician_id], backref='lab_tests_conducted')
    reviewed_by = db.relationship('User', foreign_keys=[reviewed_by_id], backref='lab_tests_reviewed')

class SystemSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), unique=True, nullable=False)
    value = db.Column(db.Text)
    description = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    action = db.Column(db.String(128), nullable=False)
    resource_type = db.Column(db.String(64))
    resource_id = db.Column(db.Integer)
    details = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='audit_logs')
