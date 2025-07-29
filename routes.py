from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session, send_file
from flask_login import login_required, current_user
from datetime import datetime, date, timedelta
import json
import io
from models import User, Patient, Appointment, MedicalRecord, LabResult, Role
from app import db
from ai_services import generate_patient_summary, generate_mini_report
from qr_service import generate_appointment_qr, verify_qr_checkin
from utils import log_audit, generate_fake_data, requires_role

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return redirect(url_for('auth.login'))

@main_bp.route('/dashboard')
@login_required
def dashboard():
    # Role-based dashboard data
    dashboard_data = {}
    
    if current_user.has_role('admin'):
        dashboard_data = {
            'total_patients': Patient.query.count(),
            'total_users': User.query.count(),
            'today_appointments': Appointment.query.filter(
                db.func.date(Appointment.appointment_date) == date.today()
            ).count(),
            'pending_lab_results': LabResult.query.filter_by(status='pending').count()
        }
    elif current_user.has_role('doctor'):
        dashboard_data = {
            'today_appointments': Appointment.query.filter(
                Appointment.doctor_id == current_user.id,
                db.func.date(Appointment.appointment_date) == date.today()
            ).count(),
            'my_patients': Patient.query.join(Appointment).filter(
                Appointment.doctor_id == current_user.id
            ).distinct().count(),
            'pending_records': MedicalRecord.query.filter_by(doctor_id=current_user.id).filter(
                MedicalRecord.ai_summary.is_(None)
            ).count()
        }
    elif current_user.has_role('receptionist'):
        dashboard_data = {
            'today_appointments': Appointment.query.filter(
                db.func.date(Appointment.appointment_date) == date.today()
            ).count(),
            'checked_in': Appointment.query.filter(
                db.func.date(Appointment.appointment_date) == date.today(),
                Appointment.status == 'arrived'
            ).count(),
            'waiting': Appointment.query.filter(
                db.func.date(Appointment.appointment_date) == date.today(),
                Appointment.status == 'scheduled'
            ).count()
        }
    
    return render_template('dashboard.html', 
                         dashboard_data=dashboard_data,
                         current_time=datetime.now().strftime('%B %d, %Y at %I:%M %p'))

@main_bp.route('/appointments')
@login_required
def appointments():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    
    query = Appointment.query
    
    # Filter by role
    if current_user.has_role('doctor'):
        query = query.filter_by(doctor_id=current_user.id)
    
    # Date filter
    date_filter = request.args.get('date')
    if date_filter:
        filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
        query = query.filter(db.func.date(Appointment.appointment_date) == filter_date)
    
    # Status filter
    status_filter = request.args.get('status')
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    appointments = query.order_by(Appointment.appointment_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return render_template('appointments.html', appointments=appointments)

@main_bp.route('/appointments/create', methods=['GET', 'POST'])
@login_required
@requires_role(['admin', 'receptionist', 'doctor'])
def create_appointment():
    if request.method == 'POST':
        # Generate unique appointment ID
        import uuid
        appointment_id = f"APT{uuid.uuid4().hex[:8].upper()}"
        
        # Combine date and time for appointment datetime
        date_str = request.form['appointment_date']
        time_str = request.form['appointment_time']
        appointment_datetime = datetime.strptime(f"{date_str} {time_str}", '%Y-%m-%d %H:%M')
        
        appointment = Appointment(
            appointment_id=appointment_id,
            patient_id=request.form['patient_id'],
            doctor_id=request.form.get('doctor_id'),
            appointment_date=appointment_datetime,
            duration=int(request.form.get('duration', 30)),
            appointment_type=request.form['appointment_type'],
            priority=request.form.get('priority', 'normal'),
            reason=request.form.get('reason'),
            notes=request.form.get('notes'),
            created_by_id=current_user.id
        )
        
        # Generate QR code for appointment
        qr_data, qr_path = generate_appointment_qr(appointment)
        appointment.qr_data = qr_data
        appointment.qr_code = qr_path
        
        db.session.add(appointment)
        db.session.commit()
        
        log_audit(current_user.id, 'create_appointment', 'appointment', appointment.id)
        flash('Appointment created successfully', 'success')
        return redirect(url_for('main.appointments'))
    
    patients = Patient.query.all()
    doctors = User.query.filter_by(role=Role.query.filter_by(name='doctor').first()).all()
    
    return render_template('create_appointment.html', patients=patients, doctors=doctors)

@main_bp.route('/qr-checkin')
@login_required
@requires_role(['receptionist', 'admin'])
def qr_checkin():
    return render_template('qr_checkin.html')

@main_bp.route('/qr-checkin/verify', methods=['POST'])
@login_required
@requires_role(['receptionist', 'admin'])
def verify_qr():
    qr_data = request.json.get('qr_data')
    
    if verify_qr_checkin(qr_data):
        appointment = Appointment.query.filter_by(qr_data=qr_data).first()
        if appointment:
            appointment.status = 'arrived'
            appointment.checked_in_at = datetime.utcnow()
            db.session.commit()
            
            log_audit(current_user.id, 'qr_checkin', 'appointment', appointment.id)
            return jsonify({'success': True, 'message': f'Patient {appointment.patient.full_name} checked in successfully'})
    
    return jsonify({'success': False, 'message': 'Invalid QR code'})

@main_bp.route('/patients')
@login_required
def patients():
    page = request.args.get('page', 1, type=int)
    per_page = 20
    
    search = request.args.get('search', '')
    query = Patient.query
    
    if search:
        query = query.filter(
            db.or_(
                Patient.first_name.ilike(f'%{search}%'),
                Patient.last_name.ilike(f'%{search}%'),
                Patient.patient_id.ilike(f'%{search}%'),
                Patient.phone_number.ilike(f'%{search}%')
            )
        )
    
    patients = query.order_by(Patient.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return render_template('patients.html', patients=patients, search=search)

@main_bp.route('/patients/create', methods=['GET', 'POST'])
@login_required
@requires_role(['admin', 'receptionist'])
def create_patient():
    if request.method == 'POST':
        # Generate unique patient ID
        import uuid
        patient_id = f"PT{uuid.uuid4().hex[:8].upper()}"
        
        patient = Patient(
            patient_id=patient_id,
            first_name=request.form['first_name'],
            last_name=request.form['last_name'],
            date_of_birth=datetime.strptime(request.form['date_of_birth'], '%Y-%m-%d').date() if request.form['date_of_birth'] else None,
            gender=request.form.get('gender'),
            phone_number=request.form['phone_number'],
            email=request.form.get('email'),
            address=request.form.get('address'),
            emergency_contact=request.form.get('emergency_contact'),
            blood_type=request.form.get('blood_type'),
            allergies=request.form.get('allergies'),
            medical_history=request.form.get('medical_history'),
            created_by_id=current_user.id
        )
        
        # Generate access code for patient dashboard
        patient.generate_access_code()
        
        db.session.add(patient)
        db.session.commit()
        
        log_audit(current_user.id, 'create_patient', 'patient', patient.id)
        flash(f'Patient created successfully. Access code: {patient.access_code}', 'success')
        return redirect(url_for('main.patients'))
    
    return render_template('create_patient.html')

@main_bp.route('/patients/<int:patient_id>')
@login_required
def patient_detail(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    
    # Get patient's appointment history
    appointments = patient.appointments.order_by(Appointment.appointment_date.desc()).limit(10).all()
    
    # Get recent medical records
    medical_records = patient.medical_records.order_by(MedicalRecord.record_date.desc()).limit(5).all()
    
    # Generate AI summary if doctor is viewing and there are previous records
    ai_summary = None
    if current_user.has_role('doctor') and medical_records:
        try:
            ai_summary = generate_patient_summary(patient, medical_records)
        except Exception as e:
            flash(f'Could not generate AI summary: {str(e)}', 'warning')
    
    return render_template('patient_detail.html', 
                         patient=patient, 
                         appointments=appointments,
                         medical_records=medical_records,
                         ai_summary=ai_summary)

@main_bp.route('/patient-dashboard')
def patient_dashboard():
    if 'patient_access' not in session:
        return redirect(url_for('auth.patient_access'))
    
    patient = Patient.query.get(session['patient_id'])
    if not patient:
        session.pop('patient_id', None)
        session.pop('patient_access', None)
        return redirect(url_for('auth.patient_access'))
    
    # Get upcoming appointments
    upcoming_appointments = patient.appointments.filter(
        Appointment.appointment_date >= datetime.utcnow()
    ).order_by(Appointment.appointment_date).limit(5).all()
    
    # Get recent lab results
    recent_lab_results = LabResult.query.filter_by(
        patient_id=patient.id, status='completed'
    ).order_by(LabResult.test_date.desc()).limit(5).all()
    
    # Get recent prescriptions from medical records
    recent_records = patient.medical_records.filter(
        MedicalRecord.prescriptions.isnot(None)
    ).order_by(MedicalRecord.record_date.desc()).limit(3).all()
    
    return render_template('patient_dashboard.html',
                         patient=patient,
                         upcoming_appointments=upcoming_appointments,
                         recent_lab_results=recent_lab_results,
                         recent_records=recent_records)

@main_bp.route('/generate-fake-data')
@login_required
@requires_role(['admin'])
def generate_fake_data_route():
    try:
        count = generate_fake_data()
        log_audit(current_user.id, 'generate_fake_data', 'system', None, {'count': count})
        flash(f'Generated {count} fake records successfully', 'success')
    except Exception as e:
        flash(f'Error generating fake data: {str(e)}', 'error')
    
    return redirect(url_for('main.dashboard'))

@main_bp.route('/print/<resource_type>/<int:resource_id>')
@login_required
def print_resource(resource_type, resource_id):
    if resource_type == 'prescription':
        record = MedicalRecord.query.get_or_404(resource_id)
        return render_template('print_layout.html', 
                             resource_type='prescription',
                             record=record,
                             patient=record.patient)
    elif resource_type == 'lab_result':
        lab_result = LabResult.query.get_or_404(resource_id)
        return render_template('print_layout.html',
                             resource_type='lab_result',
                             lab_result=lab_result,
                             patient=lab_result.patient)
    elif resource_type == 'appointment':
        appointment = Appointment.query.get_or_404(resource_id)
        return render_template('print_layout.html',
                             resource_type='appointment',
                             appointment=appointment,
                             patient=appointment.patient)
    
    flash('Invalid print resource', 'error')
    return redirect(url_for('main.dashboard'))

@main_bp.route('/api/offline-sync', methods=['POST'])
@login_required
@requires_role(['receptionist', 'admin'])
def offline_sync():
    """Handle offline appointment sync"""
    try:
        offline_data = request.json.get('appointments', [])
        synced_count = 0
        
        for apt_data in offline_data:
            # Check if appointment already exists
            existing = Appointment.query.filter_by(appointment_id=apt_data['appointment_id']).first()
            if not existing:
                appointment = Appointment(
                    appointment_id=apt_data['appointment_id'],
                    patient_id=apt_data['patient_id'],
                    doctor_id=apt_data.get('doctor_id'),
                    appointment_date=datetime.fromisoformat(apt_data['appointment_date']),
                    duration=apt_data.get('duration', 30),
                    type=apt_data['type'],
                    reason=apt_data['reason'],
                    created_by_id=current_user.id,
                    sync_status='synced'
                )
                
                # Generate QR code
                qr_data, qr_path = generate_appointment_qr(appointment)
                appointment.qr_data = qr_data
                appointment.qr_code = qr_path
                
                db.session.add(appointment)
                synced_count += 1
        
        db.session.commit()
        log_audit(current_user.id, 'offline_sync', 'appointment', None, {'synced_count': synced_count})
        
        return jsonify({'success': True, 'synced_count': synced_count})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})
