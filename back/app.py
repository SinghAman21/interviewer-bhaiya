from flask import Flask, request, jsonify
from flask_cors import CORS
from question_generator import extract_resume_text, generate_questions_from_resume
from interviewer import evaluate_answers
import os

app = Flask(__name__)
CORS(app,
     resources={r"/*": {
         "origins": [
             "http://localhost:5173",  # React app
             "http://127.0.1:5173",  # React app
             "https://your-production-domain.com"  # Replace with your production domain
         ],
         "methods": ["GET", "POST", "PUT", "DELETE"],
         "supports_credentials": True,
         "allow_headers": ["Content-Type", "Authorization" , "Accept"],
         "max_age": 3600,
                }
            },
     
     )


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200



@app.route("/uploadcv", methods=["POST"])
def upload_resume():
    file = request.files["resume"]
    path = os.path.join("uploads", file.filename)
    file.save(path)

    text = extract_resume_text(path)
    questions = generate_questions_from_resume(text)
    return jsonify({"questions": questions}), 200

@app.route("/submitqna", methods=["POST"])
def submit_answers():
    data = request.json  # [{question, answer, type}, ...]
    result = evaluate_answers(data)
    return jsonify({"results": result}), 200

@app.route("/interview-summary", methods=["POST"])
def interview_summary():
    data = request.json  # {performanceScore, aiSummary}
    score_label = getScoreLabel(data.get("performanceScore", 0))
    summary = data.get("aiSummary", "")
    return jsonify({"score_label": score_label, "summary": summary}), 200

def getScoreLabel(score):
    if score >= 90:
        return "Excellent"
    elif score >= 75:
        return "Good"
    elif score >= 50:
        return "Average"
    else:
        return "Poor"

if __name__ == "__main__":
    app.run(debug=True)
