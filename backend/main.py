from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from ingestion import process_file
from rag import query_rag

app = FastAPI(title="Agri RAG App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Agricultural RAG API is running"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Save file temporarily
        file_location = f"temp_{file.filename}"
        with open(file_location, "wb+") as file_object:
            file_object.write(file.file.read())
        
        # Process the file
        num_chunks = process_file(file_location)
        
        # Cleanup
        os.remove(file_location)
        
        return {"message": f"Successfully processed {file.filename}", "chunks_added": num_chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_index(question: str):
    try:
        answer = query_rag(question)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
