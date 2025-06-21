# interviewer.py

import json
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load Gemini
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel(model_name="gemini-1.5-flash")

def conduct_interview(questions: list) -> list:
    print("\n🎤 Starting AI-Powered Interview\n")
    results = []

    for i, q in enumerate(questions, 1):
        print(f"\nQ{i} [{q['type'].capitalize()}]: {q['question']}")
        answer = input("Your Answer: ")
        results.append({
            "question": q["question"],
            "type": q["type"],
            "answer": answer
        })

    return results

def evaluate_answers(results: list) -> list:
    prompt = {
        "prompt": f"""
You're an expert interviewer.
Score each answer below from 0 to 10 and give one-line feedback.

Respond with:
[
  {{
    "question": "...",
    "answer": "...",
    "score": 8,
    "feedback": "Good clarity, but missing details."
  }}
]
""",
        "items": results
    }

    full_prompt = json.dumps(prompt["items"], indent=2)
    final_prompt = prompt["prompt"] + "\n" + full_prompt

    try:
        response = model.generate_content(final_prompt)
        text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
        scored = json.loads(text)
        with open("interview_results.json", "w") as f:
            json.dump(scored, f, indent=2)
        return scored
    except Exception as e:
        print("❌ Scoring error:", e)
        return []
