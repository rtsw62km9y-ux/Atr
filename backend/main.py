from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = FastAPI(
    title="ATR Analyzer API",
    description="API for extracting technical data from ATR documents using OpenAI.",
    version="0.1.0"
)

# CORS settings (adjust as needed for your frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractedData(BaseModel):
    parameters: dict

@app.post("/extract", response_model=ExtractedData)
async def extract_parameters(file: UploadFile = File(...)):
    if file.content_type not in ["application/pdf", "text/plain"]:
        raise HTTPException(status_code=400, detail="File must be PDF or plain text")
    content = await file.read()

    # Extract text from PDF or use as-is if text file
    text = None
    if file.content_type == "application/pdf":
        try:
            import io
            from PyPDF2 import PdfReader
            pdf_reader = PdfReader(io.BytesIO(content))
            text = "".join(page.extract_text() for page in pdf_reader.pages if page.extract_text())
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF extraction error: {str(e)}")
    else:
        text = content.decode("utf-8", errors="ignore")

    if not text or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Could not extract text from file.")

    # Ask OpenAI to extract technical parameters
    try:
        openai.api_key = OPENAI_API_KEY
        prompt = (
            "Extract the main technical parameters (such as power, voltage, location, "
            "user, connection details, and any other relevant technical data) from the following "
            "Romanian ATR (Acord Tehnic de Racordare) document. Return the data as a JSON object "
            "with clear keys in English:\n\n"
            f"{text}\n\n"
            "JSON:"
        )
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=500,
            temperature=0.1,
            stop=["\n\n"]
        )
        import json
        parameters = json.loads(response.choices[0].text.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI extraction error: {str(e)}")

    return {"parameters": parameters}