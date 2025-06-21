# question_generator.py

import os
import json
import traceback
import pdfplumber
import docx
from dotenv import load_dotenv
import google.generativeai as genai

# Load Gemini
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel(model_name="gemini-1.5-flash")

# def extract_text_from_pdf(file_path):
#     text = ""
#     try:
#         with pdfplumber.open(file_path) as pdf:
#             for page in pdf.pages:
#                 if page_text := page.extract_text():
#                     text += page_text + "\n"
#     except Exception as e:
#         print("❌ PDF extraction error:", e)
#         traceback.print_exc()
#     return text

def extract_text_from_pdf(file_path):
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                if page_text := page.extract_text():
                    text += page_text + "\n"
    except Exception as e:
        print(f"❌ PDF extraction error: {e}")
        print("📎 Hint: Check if the file is a valid PDF. Try opening it manually.")
        return ""
    return text


def extract_text_from_docx(file_path):
    text = ""
    try:
        doc = docx.Document(file_path)
        text = "\n".join(para.text for para in doc.paragraphs)
    except Exception as e:
        print("❌ DOCX extraction error:", e)
        traceback.print_exc()
    return text

def extract_resume_text(file_path):
    if file_path.endswith(".pdf"):
        return extract_text_from_pdf(file_path)
    elif file_path.endswith(".docx"):
        return extract_text_from_docx(file_path)
    # elif file_path.endswith(".txt"):
    #     return file_path.read_text(encoding='utf-8')
    else:
        raise ValueError("Unsupported file format. Use PDF or DOCX.")

def generate_questions_from_resume(resume_text: str) -> list:
    prompt = f"""
You are an experienced technical interviewer.
Generate 2 interview questions from the following resume.
Include type: technical, behavioral, or situational.

Resume:
\"\"\"{resume_text}\"\"\"

Respond in JSON format like:
{{
  "questions": [
    {{
      "question": "What is your experience with Django?",
      "type": "technical"
    }}
  ]
}}
"""
    try:
        response = model.generate_content(prompt)
        text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
        data = json.loads(text)
        with open("questions.json", "w") as f:
            json.dump(data, f, indent=2)
        return data["questions"]
    except Exception as e:
        print("❌ Question generation error:", e)
        traceback.print_exc()
        return []
