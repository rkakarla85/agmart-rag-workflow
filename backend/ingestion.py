import pandas as pd
from langchain_core.documents import Document
from rag import get_vector_store

def process_file(file_path: str) -> int:
    """
    Reads an XLS file, converts rows to text, and ingests into the vector DB.
    Returns the number of documents added.
    """
    try:
        # Read the Excel file
        df = pd.read_excel(file_path)
        documents = []
        
        # Iterate over rows and create text chunks
        for index, row in df.iterrows():
            # Construct a descriptive text for the row
            # We try to be smart about column names, but fallback to generic
            parts = []
            for col, val in row.items():
                if pd.notna(val):
                    parts.append(f"{col}: {val}")
            
            row_text = ", ".join(parts)
            
            # Create a Document object
            # We store the row index and source file in metadata
            doc = Document(page_content=row_text, metadata={"source": file_path, "row": index})
            documents.append(doc)
            
        if not documents:
            return 0

        # Add to Vector DB
        vector_store = get_vector_store()
        vector_store.add_documents(documents)
        
        print(f"Processed {len(documents)} documents from {file_path}")
        return len(documents)
    except Exception as e:
        print(f"Error processing file: {e}")
        raise e
