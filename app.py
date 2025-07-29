import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
login_manager = LoginManager()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    
    # Database configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///pulse_hms.db")
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    
    with app.app_context():
        # Import models and routes
        import models
        import auth
        import routes
        
        # Register blueprints
        app.register_blueprint(auth.auth_bp)
        app.register_blueprint(routes.main_bp)
        
        # Create tables
        db.create_all()
        
        # Create default admin user if not exists
        from models import User, Role
        admin_role = Role.query.filter_by(name='admin').first()
        if not admin_role:
            admin_role = Role(name='admin', description='System Administrator')
            doctor_role = Role(name='doctor', description='Medical Doctor')
            receptionist_role = Role(name='receptionist', description='Front Desk Receptionist')
            lab_staff_role = Role(name='lab_staff', description='Laboratory Staff')
            
            db.session.add_all([admin_role, doctor_role, receptionist_role, lab_staff_role])
            
            admin_user = User(
                username='admin',
                email='admin@pulsehms.com',
                first_name='System',
                last_name='Administrator',
                phone='0000000000',
                role=admin_role
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
    
    return app
