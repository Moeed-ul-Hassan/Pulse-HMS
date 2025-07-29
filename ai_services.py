import json
import logging
import os
from datetime import datetime

from google import genai
from google.genai import types
from pydantic import BaseModel

# IMPORTANT: Using Google Gemini AI instead of OpenAI
# Follow these instructions when using this blueprint:
# - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
#   - do not change this unless explicitly requested by the user
# - Sometimes the google genai SDK has occasional type errors. You might need to run to validate, at time.  
# The SDK was recently renamed from google-generativeai to google-genai. This file reflects the new name and the new APIs.

# This API key is from Gemini Developer API Key, not vertex AI API Key
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))


class PatientSummary(BaseModel):
    summary: str
    key_changes: list[str]
    risk_level: str
    recommendations: list[str]


class MiniReport(BaseModel):
    report_title: str
    chief_complaint: str
    clinical_assessment: str
    treatment_provided: str
    recommendations: str
    follow_up_required: bool
    urgency_level: str


class LabAnalysis(BaseModel):
    abnormal_values: list[dict]
    clinical_significance: str
    recommendations: list[str]
    follow_up_required: bool
    priority: str


class TreatmentSuggestions(BaseModel):
    differential_diagnosis: list[str]
    recommended_tests: list[str]
    treatment_options: list[dict]
    drug_interactions: list[str]
    follow_up_timeline: str
    red_flags: list[str]


def generate_patient_summary(patient, medical_records):
    """Generate AI summary of what's changed since last appointment"""
    try:
        if len(medical_records) < 2:
            return {
                "summary": "Insufficient data for comparison summary.",
                "key_changes": [],
                "risk_level": "low",
                "recommendations": ["Schedule follow-up appointment for trend analysis"]
            }
        
        # Prepare patient data for AI analysis
        patient_data = {
            "patient_info": {
                "name": patient.full_name,
                "age": patient.age,
                "gender": patient.gender,
                "allergies": patient.allergies,
                "blood_type": patient.blood_type
            },
            "recent_records": []
        }
        
        # Include last 3 records for comparison
        for record in medical_records[:3]:
            record_data = {
                "date": record.record_date.isoformat(),
                "chief_complaint": record.chief_complaint,
                "symptoms": record.symptoms,
                "vital_signs": record.vital_signs,
                "diagnosis": record.diagnosis,
                "treatment_plan": record.treatment_plan,
                "prescriptions": record.prescriptions
            }
            patient_data["recent_records"].append(record_data)
        
        system_prompt = """You are an expert medical AI assistant specializing in patient care analysis. 
        Analyze patient data and generate a concise summary of what has changed since the last appointment.
        
        Focus on:
        - Changes in vital signs (blood pressure, temperature, weight, etc.)
        - New or resolved symptoms
        - Medication adjustments
        - Diagnosis updates
        - Overall health trends
        
        Provide a clear, clinical summary highlighting the most significant changes. Use medical terminology appropriately but keep it readable for healthcare professionals.
        
        Respond with JSON in this format:
        {
            "summary": "Clinical summary of changes",
            "key_changes": ["change 1", "change 2", "change 3"],
            "risk_level": "low|medium|high", 
            "recommendations": ["recommendation 1", "recommendation 2"]
        }"""
        
        prompt = f"Patient Data: {json.dumps(patient_data, indent=2)}"
        
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=[
                types.Content(role="user", parts=[types.Part(text=prompt)])
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=PatientSummary,
            ),
        )

        if response.text:
            data = json.loads(response.text)
            return PatientSummary(**data).model_dump()
        else:
            raise ValueError("Empty response from Gemini model")
        
    except Exception as e:
        logging.error(f"Failed to generate patient summary: {e}")
        return {
            "summary": f"Error generating summary: {str(e)}",
            "key_changes": [],
            "risk_level": "medium",
            "recommendations": ["Manual review recommended due to AI processing error"]
        }

def generate_mini_report(symptoms, actions_taken, advice, patient_name):
    """Generate AI-assisted mini medical report"""
    try:
        system_prompt = """You are a medical documentation specialist creating professional medical reports.
        Generate a structured, professional medical summary that could be used for patient records or referrals.
        
        Include:
        - Chief complaint and symptoms
        - Clinical assessment
        - Treatment provided
        - Recommendations and follow-up care
        - Professional medical language
        
        Respond with JSON in this format:
        {
            "report_title": "Medical Consultation Summary",
            "chief_complaint": "Primary reason for visit",
            "clinical_assessment": "Professional assessment of patient condition",
            "treatment_provided": "Actions taken during consultation",
            "recommendations": "Follow-up care and advice",
            "follow_up_required": true/false,
            "urgency_level": "routine|urgent|emergency"
        }"""
        
        prompt = f"""Generate a professional medical report summary based on the following information:

        Patient: {patient_name}
        Symptoms: {symptoms}
        Actions Taken: {actions_taken}
        Medical Advice: {advice}
        Date: {datetime.now().strftime('%Y-%m-%d')}"""
        
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=[
                types.Content(role="user", parts=[types.Part(text=prompt)])
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=MiniReport,
            ),
        )

        if response.text:
            data = json.loads(response.text)
            return MiniReport(**data).model_dump()
        else:
            raise ValueError("Empty response from Gemini model")
        
    except Exception as e:
        logging.error(f"Failed to generate mini report: {e}")
        return {
            "report_title": "Medical Consultation Summary",
            "chief_complaint": symptoms or "Not specified",
            "clinical_assessment": f"Error generating assessment: {str(e)}",
            "treatment_provided": actions_taken or "Not specified",
            "recommendations": advice or "Manual review recommended",
            "follow_up_required": True,
            "urgency_level": "routine"
        }

def analyze_lab_results(lab_data, reference_ranges):
    """AI analysis of lab results with insights"""
    try:
        system_prompt = """You are a clinical laboratory specialist providing lab result analysis.
        Analyze lab results and provide clinical insights including:
        - Values outside normal ranges
        - Clinical significance
        - Potential health implications
        - Recommended follow-up actions
        
        Respond with JSON in this format:
        {
            "abnormal_values": [{
                "test": "test_name",
                "value": "actual_value",
                "reference": "normal_range",
                "status": "high|low|critical"
            }],
            "clinical_significance": "Overall clinical interpretation",
            "recommendations": ["recommendation 1", "recommendation 2"],
            "follow_up_required": true/false,
            "priority": "low|medium|high|urgent"
        }"""
        
        prompt = f"""Analyze the following lab results and provide clinical insights:

        Lab Results: {json.dumps(lab_data, indent=2)}
        Reference Ranges: {json.dumps(reference_ranges, indent=2)}"""
        
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=[
                types.Content(role="user", parts=[types.Part(text=prompt)])
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=LabAnalysis,
            ),
        )

        if response.text:
            data = json.loads(response.text)
            return LabAnalysis(**data).model_dump()
        else:
            raise ValueError("Empty response from Gemini model")
        
    except Exception as e:
        logging.error(f"Failed to analyze lab results: {e}")
        return {
            "abnormal_values": [],
            "clinical_significance": f"Error analyzing results: {str(e)}",
            "recommendations": ["Manual review recommended due to AI processing error"],
            "follow_up_required": True,
            "priority": "medium"
        }

def generate_treatment_suggestions(patient_data, symptoms, medical_history):
    """AI-powered treatment suggestions based on patient data"""
    try:
        system_prompt = """You are a medical AI assistant providing clinical decision support. 
        Always emphasize that suggestions require professional medical review.
        
        Provide evidence-based treatment suggestions including:
        - Differential diagnosis considerations
        - Recommended diagnostic tests
        - Treatment options
        - Preventive measures
        - Drug interactions and contraindications

        IMPORTANT: These are suggestions only and should be reviewed by qualified medical professionals.

        Respond with JSON in this format:
        {
            "differential_diagnosis": ["diagnosis 1", "diagnosis 2"],
            "recommended_tests": ["test 1", "test 2"],
            "treatment_options": [{
                "treatment": "treatment description",
                "rationale": "medical rationale",
                "contraindications": ["contraindication 1"]
            }],
            "drug_interactions": ["interaction warning 1"],
            "follow_up_timeline": "recommended follow-up schedule",
            "red_flags": ["warning sign 1", "warning sign 2"]
        }"""
        
        prompt = f"""Based on the patient information below, provide treatment suggestions and recommendations:

        Patient Data: {json.dumps(patient_data, indent=2)}
        Current Symptoms: {symptoms}
        Medical History: {json.dumps(medical_history, indent=2)}"""
        
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=[
                types.Content(role="user", parts=[types.Part(text=prompt)])
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=TreatmentSuggestions,
            ),
        )

        if response.text:
            data = json.loads(response.text)
            return TreatmentSuggestions(**data).model_dump()
        else:
            raise ValueError("Empty response from Gemini model")
        
    except Exception as e:
        logging.error(f"Failed to generate treatment suggestions: {e}")
        return {
            "differential_diagnosis": ["Manual assessment required"],
            "recommended_tests": ["Complete medical evaluation"],
            "treatment_options": [{
                "treatment": f"Error generating suggestions: {str(e)}",
                "rationale": "AI processing error - manual review required",
                "contraindications": ["Review all patient factors manually"]
            }],
            "drug_interactions": ["Manual drug interaction check required"],
            "follow_up_timeline": "Immediate medical professional consultation",
            "red_flags": ["AI system error - seek immediate medical review"]
        }
