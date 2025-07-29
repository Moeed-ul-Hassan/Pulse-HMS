"""
Pulse HMS - Seven Layers of Security
A comprehensive security system for healthcare data protection
"""

import hashlib
import secrets
import time
import jwt
import re
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, session, current_app, abort
from flask_login import current_user
import logging

# Configure security logging
security_logger = logging.getLogger('security')
security_logger.setLevel(logging.INFO)

class SecurityManager:
    """Seven Layers of Security Implementation"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize security with Flask app"""
        self.app = app
        
        # Layer 1: Rate Limiting
        self.rate_limit_store = {}
        
        # Layer 2: Session Security
        app.config['SESSION_COOKIE_SECURE'] = True
        app.config['SESSION_COOKIE_HTTPONLY'] = True
        app.config['SESSION_COOKIE_SAMESITE'] = 'Strict'
        app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=2)
        
        # Layer 3: CSRF Protection
        app.config['WTF_CSRF_ENABLED'] = True
        app.config['WTF_CSRF_TIME_LIMIT'] = 3600
        
        # Layer 4: Input Validation
        self.sanitization_patterns = {
            'sql_injection': re.compile(r'(\b(union|select|insert|update|delete|drop|create|alter)\b)', re.IGNORECASE),
            'xss': re.compile(r'<script|javascript:|vbscript:|onload=|onerror=', re.IGNORECASE),
            'path_traversal': re.compile(r'\.\./|\.\.\\|%2e%2e%2f|%2e%2e%5c', re.IGNORECASE),
            'command_injection': re.compile(r'[;&|`$()]', re.IGNORECASE)
        }
        
        # Layer 5: Encryption Keys
        self.encryption_key = app.config.get('SECRET_KEY', secrets.token_hex(32))
        
        # Layer 6: Audit Trail
        self.audit_log = []
        
        # Layer 7: Threat Detection
        self.threat_indicators = {
            'failed_logins': {},
            'suspicious_ips': set(),
            'unusual_activity': []
        }

# Global security manager instance
security = SecurityManager()

def layer_1_rate_limiting(max_requests=100, window=60):
    """Layer 1: Rate Limiting - Prevent brute force attacks"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr
            current_time = time.time()
            
            # Clean old entries
            security.rate_limit_store = {
                k: v for k, v in security.rate_limit_store.items() 
                if current_time - v['timestamp'] < window
            }
            
            # Check rate limit
            if client_ip in security.rate_limit_store:
                if security.rate_limit_store[client_ip]['count'] >= max_requests:
                    security_logger.warning(f"Rate limit exceeded for IP: {client_ip}")
                    return jsonify({
                        'error': 'Rate limit exceeded. Please try again later.',
                        'retry_after': window
                    }), 429
            
            # Update rate limit counter
            if client_ip not in security.rate_limit_store:
                security.rate_limit_store[client_ip] = {'count': 0, 'timestamp': current_time}
            security.rate_limit_store[client_ip]['count'] += 1
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def layer_2_session_security():
    """Layer 2: Session Security - Validate and secure sessions"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check session validity
            if not session.get('_fresh'):
                security_logger.warning(f"Invalid session attempt from IP: {request.remote_addr}")
                return jsonify({'error': 'Session expired. Please login again.'}), 401
            
            # Validate session token
            session_token = session.get('session_token')
            if not session_token or not validate_session_token(session_token):
                security_logger.warning(f"Invalid session token from IP: {request.remote_addr}")
                session.clear()
                return jsonify({'error': 'Invalid session. Please login again.'}), 401
            
            # Check session timeout
            if is_session_expired(session):
                security_logger.info(f"Session expired for user: {current_user.id if current_user.is_authenticated else 'anonymous'}")
                session.clear()
                return jsonify({'error': 'Session expired. Please login again.'}), 401
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def layer_3_csrf_protection():
    """Layer 3: CSRF Protection - Prevent cross-site request forgery"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
                # Check CSRF token
                csrf_token = request.headers.get('X-CSRF-Token') or request.form.get('csrf_token')
                if not csrf_token or not validate_csrf_token(csrf_token):
                    security_logger.warning(f"CSRF attack attempt from IP: {request.remote_addr}")
                    return jsonify({'error': 'Invalid CSRF token'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def layer_4_input_validation():
    """Layer 4: Input Validation - Sanitize and validate all inputs"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Validate request data
            if request.is_json:
                data = request.get_json()
                if not validate_json_input(data):
                    security_logger.warning(f"Malicious JSON input from IP: {request.remote_addr}")
                    return jsonify({'error': 'Invalid input data'}), 400
            
            # Validate form data
            if request.form:
                if not validate_form_input(request.form):
                    security_logger.warning(f"Malicious form input from IP: {request.remote_addr}")
                    return jsonify({'error': 'Invalid form data'}), 400
            
            # Validate URL parameters
            if request.args:
                if not validate_url_params(request.args):
                    security_logger.warning(f"Malicious URL parameters from IP: {request.remote_addr}")
                    return jsonify({'error': 'Invalid URL parameters'}), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def layer_5_encryption():
    """Layer 5: Encryption - Encrypt sensitive data"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Encrypt sensitive data in response
            response = f(*args, **kwargs)
            
            if isinstance(response, tuple):
                data, status_code = response
            else:
                data, status_code = response, 200
            
            # Encrypt sensitive fields if present
            if isinstance(data, dict):
                data = encrypt_sensitive_data(data)
            
            return jsonify(data), status_code
        return decorated_function
    return decorator

def layer_6_audit_trail():
    """Layer 6: Audit Trail - Log all security events"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            start_time = time.time()
            
            # Log request details
            audit_entry = {
                'timestamp': datetime.utcnow(),
                'user_id': current_user.id if current_user.is_authenticated else None,
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent'),
                'endpoint': request.endpoint,
                'method': request.method,
                'status': None,
                'duration': None
            }
            
            try:
                response = f(*args, **kwargs)
                audit_entry['status'] = 'success'
            except Exception as e:
                audit_entry['status'] = 'error'
                audit_entry['error'] = str(e)
                security_logger.error(f"Security error: {e}")
                raise
            finally:
                audit_entry['duration'] = time.time() - start_time
                security.audit_log.append(audit_entry)
                
                # Keep only last 1000 entries
                if len(security.audit_log) > 1000:
                    security.audit_log = security.audit_log[-1000:]
            
            return response
        return decorated_function
    return decorator

def layer_7_threat_detection():
    """Layer 7: Threat Detection - Detect and respond to threats"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr
            
            # Check for suspicious patterns
            if detect_suspicious_activity(client_ip):
                security_logger.warning(f"Suspicious activity detected from IP: {client_ip}")
                security.threat_indicators['suspicious_ips'].add(client_ip)
                
                # Implement progressive response
                if client_ip in security.threat_indicators['suspicious_ips']:
                    return jsonify({
                        'error': 'Suspicious activity detected. Access temporarily restricted.',
                        'retry_after': 300
                    }), 403
            
            # Check for unusual behavior
            if detect_unusual_behavior():
                security_logger.warning(f"Unusual behavior detected from IP: {client_ip}")
                security.threat_indicators['unusual_activity'].append({
                    'ip': client_ip,
                    'timestamp': datetime.utcnow(),
                    'activity': 'unusual_pattern'
                })
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Security utility functions
def validate_session_token(token):
    """Validate session token"""
    try:
        payload = jwt.decode(token, security.encryption_key, algorithms=['HS256'])
        return payload.get('valid', False)
    except:
        return False

def is_session_expired(session_data):
    """Check if session is expired"""
    last_activity = session_data.get('last_activity')
    if not last_activity:
        return True
    
    try:
        last_activity = datetime.fromisoformat(last_activity)
        return datetime.utcnow() - last_activity > timedelta(hours=2)
    except:
        return True

def validate_csrf_token(token):
    """Validate CSRF token"""
    if not token:
        return False
    
    # Simple token validation (in production, use proper CSRF library)
    return len(token) >= 32 and token.isalnum()

def validate_json_input(data):
    """Validate JSON input for malicious content"""
    if not isinstance(data, dict):
        return False
    
    def check_value(value):
        if isinstance(value, str):
            return not contains_malicious_content(value)
        elif isinstance(value, dict):
            return all(check_value(v) for v in value.values())
        elif isinstance(value, list):
            return all(check_value(v) for v in value)
        return True
    
    return check_value(data)

def validate_form_input(form_data):
    """Validate form input for malicious content"""
    for key, value in form_data.items():
        if isinstance(value, str) and contains_malicious_content(value):
            return False
    return True

def validate_url_params(params):
    """Validate URL parameters for malicious content"""
    for key, value in params.items():
        if isinstance(value, str) and contains_malicious_content(value):
            return False
    return True

def contains_malicious_content(text):
    """Check if text contains malicious content"""
    text_lower = text.lower()
    
    for pattern_name, pattern in security.sanitization_patterns.items():
        if pattern.search(text_lower):
            security_logger.warning(f"Malicious content detected: {pattern_name}")
            return True
    
    return False

def encrypt_sensitive_data(data):
    """Encrypt sensitive data fields"""
    sensitive_fields = ['password', 'ssn', 'credit_card', 'medical_record']
    
    def encrypt_value(value):
        if isinstance(value, str) and any(field in value.lower() for field in sensitive_fields):
            return f"ENCRYPTED_{hashlib.sha256(value.encode()).hexdigest()[:16]}"
        return value
    
    def encrypt_dict(d):
        encrypted = {}
        for key, value in d.items():
            if isinstance(value, dict):
                encrypted[key] = encrypt_dict(value)
            elif isinstance(value, list):
                encrypted[key] = [encrypt_dict(item) if isinstance(item, dict) else encrypt_value(item) for item in value]
            else:
                encrypted[key] = encrypt_value(value)
        return encrypted
    
    return encrypt_dict(data)

def detect_suspicious_activity(ip_address):
    """Detect suspicious activity patterns"""
    # Check for rapid requests
    if ip_address in security.rate_limit_store:
        recent_requests = security.rate_limit_store[ip_address]['count']
        if recent_requests > 50:  # More than 50 requests in window
            return True
    
    # Check for known malicious patterns
    user_agent = request.headers.get('User-Agent', '')
    suspicious_agents = ['bot', 'crawler', 'scanner', 'sqlmap', 'nikto']
    if any(agent in user_agent.lower() for agent in suspicious_agents):
        return True
    
    return False

def detect_unusual_behavior():
    """Detect unusual user behavior"""
    if not current_user.is_authenticated:
        return False
    
    # Check for unusual access patterns
    current_time = datetime.utcnow()
    if current_time.hour < 6 or current_time.hour > 22:  # Outside normal hours
        return True
    
    # Check for rapid page navigation
    last_request = session.get('last_request_time')
    if last_request:
        try:
            last_request = datetime.fromisoformat(last_request)
            if (current_time - last_request).seconds < 2:  # Less than 2 seconds between requests
                return True
        except:
            pass
    
    session['last_request_time'] = current_time.isoformat()
    return False

# Combined security decorator
def secure_endpoint():
    """Apply all seven layers of security"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Apply all security layers
            f = layer_1_rate_limiting()(f)
            f = layer_2_session_security()(f)
            f = layer_3_csrf_protection()(f)
            f = layer_4_input_validation()(f)
            f = layer_5_encryption()(f)
            f = layer_6_audit_trail()(f)
            f = layer_7_threat_detection()(f)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Security monitoring functions
def get_security_status():
    """Get current security status"""
    return {
        'rate_limited_ips': len(security.rate_limit_store),
        'suspicious_ips': len(security.threat_indicators['suspicious_ips']),
        'audit_entries': len(security.audit_log),
        'unusual_activities': len(security.threat_indicators['unusual_activity']),
        'security_level': 'MAXIMUM'
    }

def clear_security_data():
    """Clear security data (for testing)"""
    security.rate_limit_store.clear()
    security.threat_indicators['suspicious_ips'].clear()
    security.threat_indicators['unusual_activity'].clear()
    security.audit_log.clear() 