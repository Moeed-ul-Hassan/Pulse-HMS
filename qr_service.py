import qrcode
import os
import uuid
from io import BytesIO
import base64
from datetime import datetime
from models import Appointment

def generate_appointment_qr(appointment):
    """Generate QR code for appointment check-in"""
    try:
        # Create unique QR data with timestamp and appointment info
        qr_data = f"PULSE_HMS:{appointment.appointment_id}:{appointment.patient_id}:{datetime.utcnow().isoformat()}"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # Create QR code image
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to static directory
        qr_filename = f"qr_{appointment.appointment_id}_{uuid.uuid4().hex[:8]}.png"
        qr_path = os.path.join('static', 'qr_codes', qr_filename)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(qr_path), exist_ok=True)
        
        # Save QR code image
        qr_img.save(qr_path)
        
        return qr_data, qr_path
        
    except Exception as e:
        raise Exception(f"Failed to generate QR code: {e}")

def verify_qr_checkin(qr_data):
    """Verify QR code for patient check-in"""
    try:
        if not qr_data or not qr_data.startswith("PULSE_HMS:"):
            return False
        
        # Parse QR data
        parts = qr_data.split(":")
        if len(parts) < 4:
            return False
        
        appointment_id = parts[1]
        patient_id = parts[2]
        timestamp = parts[3]
        
        # Find appointment
        appointment = Appointment.query.filter_by(
            appointment_id=appointment_id,
            patient_id=int(patient_id)
        ).first()
        
        if not appointment:
            return False
        
        # Check if appointment is today and not already checked in
        appointment_date = appointment.appointment_date.date()
        today = datetime.utcnow().date()
        
        if appointment_date != today:
            return False
        
        if appointment.status == 'arrived':
            return False  # Already checked in
        
        return True
        
    except Exception as e:
        return False

def generate_qr_for_patient_access(patient):
    """Generate QR code for patient dashboard access"""
    try:
        qr_data = f"PULSE_PATIENT:{patient.phone}:{patient.access_code}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64 for embedding in templates
        buffer = BytesIO()
        qr_img.save(buffer, format='PNG')
        buffer.seek(0)
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{qr_base64}"
        
    except Exception as e:
        raise Exception(f"Failed to generate patient QR code: {e}")
