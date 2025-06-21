# main.py

from flask import Flask, request, render_template, redirect, url_for
from question_generator import extract_resume_text, generate_questions_from_resume
from interviewer import evaluate_answers
from audio_processor import process_audio
import os
import uuid
import json

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        resume = request.files['resume']
        if resume:
            file_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}.pdf")
            resume.save(file_path)
            return redirect(url_for('interview', resume_path=file_path))
    return render_template('index.html')

@app.route('/interview')
def interview():
    resume_path = request.args.get('resume_path')
    resume_text = extract_resume_text(resume_path)
    questions = generate_questions_from_resume(resume_text)
    return render_template('interview.html', questions=questions, resume_path=resume_path)

@app.route('/submit_answers', methods=['POST'])
def submit_answers():
    resume_path = request.form['resume_path']
    responses = []
    for i in range(5):  # Adjust if you have more/less questions
        audio = request.files.get(f'audio_{i}')
        if audio:
            audio_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}.wav")
            audio.save(audio_path)
            processed = process_audio(audio_path)
            responses.append({
                "question": request.form[f'question_{i}'],
                "answer": processed["transcription"],
                "emotion": processed["emotion"],
                "fluency_score": processed["fluency_score"]
            })

    scored = evaluate_answers(responses)
    avg_score = sum(i["score"] for i in scored) / len(scored)
    return render_template('results.html', scored=scored, avg_score=avg_score)

if __name__ == '__main__':
    app.run(debug=True)
# main.py