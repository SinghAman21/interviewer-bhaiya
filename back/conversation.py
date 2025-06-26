# conversational_interviewer.py

from faster_whisper import WhisperModel
import pyttsx3
import sounddevice as sd
import numpy as np
import scipy.io.wavfile
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import uuid
from pyAudioAnalysis import audioSegmentation as aS
import librosa


# Load API key
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

# TTS engine
tts_engine = pyttsx3.init()

def speak(text):
    print(f"🗣️ AI says: {text}")
    tts_engine.say(text)
    tts_engine.runAndWait()

# Whisper setup
whisper_model = WhisperModel("base")

def record_audio(filename, duration=10, fs=44100):
    print("🎙️ Recording... Please answer now.")
    folder = os.path.join(os.getcwd(), "audio_input")
    os.makedirs(folder, exist_ok=True)
    full_path = os.path.join(folder, filename)
    audio = sd.rec(int(duration * fs), samplerate=fs, channels=1)
    sd.wait()
    scipy.io.wavfile.write(full_path, fs, audio)
    print(f"✅ Saved recording: {full_path}")
    return full_path

FILLERS = ["uh", "um", "like", "you know", "hmm", "ah", "er", "so"]
def count_fillers(transcript):
    words = transcript.lower().split()
    return sum(words.count(f) for f in FILLERS)


def detect_silences(audio_path):
    segs, _, _ = aS.silence_removal(audio_path, 16000, 0.05, 0.05, smooth_window=1.0, weight=0.3, plot=False)
    return segs  # List of non-silent intervals


def transcribe_audio(file_path):
    segments, _ = whisper_model.transcribe(file_path)
    return " ".join([seg.text for seg in segments])

def evaluate_answer(question, answer, audio_features):
    prompt = f"""
You're an AI interviewer.

Evaluate the following response for both content and delivery. Consider the answer, as well as the following audio features:
- Filler words used: {audio_features['filler_count']}
- Silence ratio: {audio_features['silence_ratio']}
- Tempo: {audio_features['tempo']}
- Average pitch: {audio_features['avg_pitch']}

Q: {question}
A: {answer}

Respond in JSON:
{{
  "score": 0-10,  // holistic score considering both content and delivery
  "feedback": "..." // mention if fillers, silences, or delivery affected the score
}}
"""
    try:
        response = model.generate_content(prompt)
        text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
        result = json.loads(text)
        return result
    except Exception as e:
        print("❌ Gemini evaluation failed:", e)
        return {"score": 0, "feedback": "Unable to evaluate."}

# def ask_and_evaluate(question):
#     speak(question)

#     filename = f"answer_{uuid.uuid4()}.wav"
#     file_path = record_audio(filename)
#     transcript = transcribe_audio(file_path)
#     print(f"📝 Transcript: {transcript}")

#     result = evaluate_answer(question, transcript)
#     print(f"🎯 Score: {result['score']}/10")  #NOT NECESSARY ATM
#     # print(f"💬 Feedback: {result['feedback']}") #NOT NECESSARY ATM

#     # speak(f"You scored {result['score']} out of 10.")
#     # speak(result["feedback"])

#     return {
#         "question": question,
#         "answer": transcript,
#         "score": result["score"],
#         "feedback": result["feedback"],
#         "audio_file": file_path
#     }

def analyze_audio_features(audio_path, transcript):
    # Filler detection
    filler_count = count_fillers(transcript)

    # Silence detection
    try:
        # Load audio manually as numpy array for silence detection
        y, sr = librosa.load(audio_path, sr=16000)
        segs, _, _ = aS.silence_removal(y, sr, 0.05, 0.05, smooth_window=1.0, weight=0.3, plot=False)
        
        duration = librosa.get_duration(y=y, sr=sr)
        spoken_duration = sum(end - start for start, end in segs)
        silence_ratio = 1 - (spoken_duration / duration)
    except Exception as e:
        print("⚠️ Silence detection failed:", e)
        silence_ratio = 0.2  # fallback

    # Pitch & tempo detection
    try:
        y, sr = librosa.load(audio_path)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch_values = pitches[magnitudes > 0]
        avg_pitch = float(pitch_values.mean()) if len(pitch_values) > 0 else 0
    except Exception as e:
        print("⚠️ Pitch/tempo analysis failed:", e)
        tempo, avg_pitch = 0, 0

    # Confidence scoring (heuristic)
    confidence_score = 10 - (filler_count * 0.7 + silence_ratio * 10)
    confidence_score = round(max(0, min(10, confidence_score)), 2)

    return {
        "filler_count": filler_count,
        "silence_ratio": round(silence_ratio, 2),
        "tempo": round(float(tempo), 2),
        "avg_pitch": round(avg_pitch, 2),
        "confidence_score": confidence_score
    }


def ask_and_evaluate(question):
    speak(question)

    filename = f"answer_{uuid.uuid4()}.wav"
    file_path = record_audio(filename)
    transcript = transcribe_audio(file_path)
    print(f"📝 Transcript: {transcript}")

    audio_features = analyze_audio_features(file_path, transcript)
    result = evaluate_answer(question, transcript, audio_features)

    print(f"🎯 Score: {result['score']}/10")
    print(f"🧠 Confidence Score: {audio_features['confidence_score']}/10")
    print(f"🙊 Fillers: {audio_features['filler_count']} | 🔇 Silence Ratio: {audio_features['silence_ratio']}")

    return {
        "question": question,
        "answer": transcript,
        "score": result["score"],
        "feedback": result["feedback"],
        "confidence_score": audio_features["confidence_score"],
        "filler_count": audio_features["filler_count"],
        "silence_ratio": audio_features["silence_ratio"],
        "tempo": audio_features["tempo"],
        "avg_pitch": audio_features["avg_pitch"],
        "audio_file": file_path
    }


def run_interview():
    speak("Welcome to your AI-powered voice interview.")

    summary = "B.Tech student with experience in Python, Flask, and React."

    gen_prompt = f"""You're an expert interviewer. Generate 3 JSON-formatted questions (technical, behavioral, situational) for this candidate:

Resume Summary: {summary}

Respond as:
{{
  "questions": [
    {{"question": "...", "type": "technical"}},
    ...
  ]
}}"""

    try:
        response = model.generate_content(gen_prompt)
        cleaned = response.text.strip().removeprefix("```json").removesuffix("```").strip()
        questions = json.loads(cleaned)["questions"]
    except Exception as e:
        print("⚠️ Question generation failed. Using defaults.")
        questions = [
            {"question": "Tell me about a Python project you've built."},
            {"question": "Describe a time you worked under pressure."},
            {"question": "How would you resolve a team conflict?"}
        ]

    qa_log = []

    for qno, q in enumerate(questions, 1):
        question_text = q["question"] if isinstance(q, dict) else q
        result = ask_and_evaluate(question_text)
        qa_log.append(result)

    avg = sum(entry["score"] for entry in qa_log) / len(qa_log)
    speak("Interview complete.")
    speak(f"Your average score is {avg:.2f} out of 10.")

    print("\n📊 Final Interview Summary:")
    for entry in qa_log:
        print(f"\nQ: {entry['question']}\nA: {entry['answer']}\nScore: {entry['score']}/10\nFeedback: {entry['feedback']}")

    output = {
        "interview_summary": {
            "average_score": round(avg, 2),
            "questions_answered": len(qa_log)
        },
        "qa_log": qa_log
    }

    with open("voice_interview_results.json", "w") as f:
        json.dump(output, f, indent=2)

    print("\n✅ Interview results saved to voice_interview_results.json")
    return output  # Optional if using in another script

if __name__ == "__main__":
    run_interview()
