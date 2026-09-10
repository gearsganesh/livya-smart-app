from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
import os

app=FastAPI(title='LIVYA Private AI Worker')
TOKEN=os.getenv('AI_SERVICE_TOKEN','')
class ProcessRequest(BaseModel):
    input_type:str
    text:str|None=None
    audio_base64:str|None=None
    audio_mime_type:str|None=None
    context:dict={}
@app.get('/health')
def health(): return {'status':'ok'}
@app.post('/process')
def process(payload:ProcessRequest, authorization:str|None=Header(default=None)):
    if not TOKEN or authorization != f'Bearer {TOKEN}': raise HTTPException(401,'Unauthorized')
    # Production adapter: connect this boundary to the private Ollama/Whisper runtime.
    # Never log or persist payload contents. Return only the schema approved by the API.
    raise HTTPException(503,'AI worker model runtime is not configured')
