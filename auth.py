from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from models import User, Patient
from app import db, login_manager
from utils import log_audit

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        remember_me = bool(request.form.get('remember_me'))
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password) and user.is_active:
            login_user(user, remember=remember_me)
            user.last_login = db.datetime.utcnow()
            db.session.commit()
            
            log_audit(user.id, 'login', 'user', user.id, {'username': username})
            
            next_page = request.args.get('next')
            if next_page:
                return redirect(next_page)
            return redirect(url_for('main.dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    log_audit(current_user.id, 'logout', 'user', current_user.id)
    logout_user()
    flash('You have been logged out successfully', 'success')
    return redirect(url_for('auth.login'))

@auth_bp.route('/patient-access', methods=['GET', 'POST'])
def patient_access():
    if request.method == 'POST':
        phone = request.form['phone']
        access_code = request.form['access_code']
        
        patient = Patient.query.filter_by(phone=phone, access_code=access_code).first()
        
        if patient:
            session['patient_id'] = patient.id
            session['patient_access'] = True
            log_audit(None, 'patient_access', 'patient', patient.id, {
                'phone': phone,
                'access_method': 'phone_code'
            })
            return redirect(url_for('main.patient_dashboard'))
        else:
            flash('Invalid phone number or access code', 'error')
    
    return render_template('patient_access.html')

@auth_bp.route('/patient-logout')
def patient_logout():
    if 'patient_id' in session:
        log_audit(None, 'patient_logout', 'patient', session['patient_id'])
        session.pop('patient_id', None)
        session.pop('patient_access', None)
    flash('You have been logged out successfully', 'success')
    return redirect(url_for('auth.patient_access'))
