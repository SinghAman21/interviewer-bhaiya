# main.py

from question_generator import extract_resume_text, generate_questions_from_resume
from conversation import speak, ask_and_evaluate
import json

def run_resume_based_interview(resume_path):
    print(f"📄 Extracting resume from: {resume_path}")
    resume_text = extract_resume_text(resume_path)

    if not resume_text.strip():
        print("❌ Resume text is empty. Please check the file.")
        return

    print("🤖 Generating interview questions based on resume...")
    questions = generate_questions_from_resume(resume_text)

    if not questions:
        print("❌ No questions were generated from the resume.")
        return

    speak("Welcome to your AI-powered voice interview based on your resume.")
    all_results = []

    for qno, q in enumerate(questions, 1):
        question = q["question"] if isinstance(q, dict) else q
        result = ask_and_evaluate(question)
        all_results.append(result)

    avg_score = sum(r["score"] for r in all_results) / len(all_results)
    speak("Interview complete.")
    speak(f"Your average score is {avg_score:.2f} out of 10.")

    print("\n📊 Final Interview Summary:")
    for r in all_results:
        print(f"\nQ: {r['question']}\nA: {r['answer']}\nScore: {r['score']}/10\nFeedback: {r['feedback']}")

    with open("interview_results.json", "w") as f:
        json.dump(all_results, f, indent=2)

    print(f"\n✅ Results saved to interview_results.json")

if __name__ == "__main__":
    # You can change this to accept input from a file picker or UI
    RESUME_PATH = "Resume CreatED.pdf"  # Update this path as needed
    run_resume_based_interview(RESUME_PATH)
    # data = extract_resume_text("Resume.pdf")
    # open("resume.pdf", "w").write(data)
    # run_resume_based_interview("resume.pdf")
