from functools import wraps
from flask import abort, request, session
from flask_login import current_user
from datetime import datetime
import random
import string
from models import AuditLog, Patient, Appointment, User, Role, MedicalRecord, LabResult
from app import db

def log_audit(user_id, action, resource_type, resource_id, details=None):
    """Log user actions for audit trail"""
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=request.remote_addr if request else None,
            user_agent=request.user_agent.string if request else None
        )
        db.session.add(audit_log)
        db.session.commit()
    except Exception as e:
        # Don't let audit logging failures break the application
        pass

def requires_role(allowed_roles):
    """Decorator to check user roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                abort(401)
            
            if not any(current_user.has_role(role) for role in allowed_roles):
                abort(403)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def generate_fake_data():
    """Generate realistic fake data for demo/testing purposes"""
    try:
        # Sample data pools
        first_names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Jennifer']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        genders = ['Male', 'Female']
        appointment_types = ['Consultation', 'Follow-up', 'Check-up', 'Emergency', 'Specialist']
        
        count = 0
        
        # Generate fake patients
        for i in range(20):
            patient_id = f"PT{random.randint(10000, 99999)}"
            patient = Patient(
                patient_id=patient_id,
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                date_of_birth=datetime(
                    random.randint(1950, 2005),
                    random.randint(1, 12),
                    random.randint(1, 28)
                ).date(),
                gender=random.choice(genders),
                phone=f"{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(1000, 9999)}",
                email=f"patient{i}@example.com",
                blood_type=random.choice(blood_types),
                allergies="None reported" if random.random() > 0.3 else "Penicillin, Shellfish"
            )
            patient.generate_access_code()
            db.session.add(patient)
            count += 1
        
        db.session.commit()
        
        # Generate fake appointments
        patients = Patient.query.all()
        doctors = User.query.filter_by(role=Role.query.filter_by(name='doctor').first()).all()
        
        if doctors:  # Only create appointments if doctors exist
            for i in range(30):
                appointment_id = f"APT{random.randint(10000, 99999)}"
                appointment = Appointment(
                    appointment_id=appointment_id,
                    patient_id=random.choice(patients).id,
                    doctor_id=random.choice(doctors).id if doctors else None,
                    appointment_date=datetime.now().replace(
                        hour=random.randint(9, 17),
                        minute=random.choice([0, 15, 30, 45])
                    ),
                    duration=random.choice([15, 30, 45, 60]),
                    type=random.choice(appointment_types),
                    reason="Routine checkup and consultation",
                    status=random.choice(['scheduled', 'arrived', 'completed'])
                )
                db.session.add(appointment)
                count += 1
        
        # Generate fake medical records
        for i in range(15):
            record = MedicalRecord(
                patient_id=random.choice(patients).id,
                doctor_id=random.choice(doctors).id if doctors else None,
                chief_complaint="Patient presents with routine health concerns",
                symptoms={
                    "primary": random.choice(["Headache", "Fatigue", "Cough", "Fever"]),
                    "secondary": ["Mild discomfort", "Sleep issues"]
                },
                vital_signs={
                    "blood_pressure": f"{random.randint(110, 140)}/{random.randint(70, 90)}",
                    "temperature": f"{random.randint(97, 99)}.{random.randint(0, 9)}°F",
                    "pulse": f"{random.randint(60, 100)} bpm",
                    "weight": f"{random.randint(120, 200)} lbs"
                },
                diagnosis="Routine examination - no acute concerns",
                treatment_plan="Continue current medications, follow-up in 3 months"
            )
            db.session.add(record)
            count += 1
        
        db.session.commit()
        return count
        
    except Exception as e:
        db.session.rollback()
        raise Exception(f"Failed to generate fake data: {e}")

def format_phone(phone):
    """Format phone number for display"""
    if len(phone) == 10:
        return f"({phone[:3]}) {phone[3:6]}-{phone[6:]}"
    return phone

def calculate_age(birth_date):
    """Calculate age from birth date"""
    today = datetime.now().date()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

def generate_patient_id():
    """Generate unique patient ID"""
    while True:
        patient_id = f"PT{random.randint(10000, 99999)}"
        if not Patient.query.filter_by(patient_id=patient_id).first():
            return patient_id

def generate_appointment_id():
    """Generate unique appointment ID"""
    while True:
        appointment_id = f"APT{random.randint(10000, 99999)}"
        if not Appointment.query.filter_by(appointment_id=appointment_id).first():
            return appointment_id
