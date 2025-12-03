import pandas as pd
import json
from langchain_core.documents import Document
from rag import get_vector_store

def process_file(file_path: str, limit: int = None) -> int:
    """
    Reads a file (CSV or Excel), converts rows to JSON, extracts metadata,
    and ingests into the vector DB.
    Returns the number of documents added.
    """
    try:
        # Read the file based on extension
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
            
        if limit:
            df = df.head(limit)
            
        documents = []
        
        # Iterate over rows
        for index, row in df.iterrows():
            # Convert row to dictionary
            row_dict = row.to_dict()
            # Handle NaN values
            row_dict = {k: (v if pd.notna(v) else None) for k, v in row_dict.items()}
            
            # Create human-readable text instead of JSON for better semantic search
            text_parts = []
            
            # Add key information in natural language
            if row_dict.get("display_name"):
                text_parts.append(f"Commodity: {row_dict['display_name']}")
            if row_dict.get("variety"):
                text_parts.append(f"Variety: {row_dict['variety']}")
            if row_dict.get("category"):
                text_parts.append(f"Category: {row_dict['category']}")
            if row_dict.get("market_name"):
                text_parts.append(f"Market: {row_dict['market_name']}")
            if row_dict.get("district_name"):
                text_parts.append(f"District: {row_dict['district_name']}")
            if row_dict.get("state_name"):
                text_parts.append(f"State: {row_dict['state_name']}")
            if row_dict.get("arrival_date"):
                text_parts.append(f"Date: {row_dict['arrival_date']}")
            if row_dict.get("modal_price"):
                text_parts.append(f"Modal Price: {row_dict['modal_price']} {row_dict.get('price_unit', '')}")
            if row_dict.get("min_price"):
                text_parts.append(f"Min Price: {row_dict['min_price']} {row_dict.get('price_unit', '')}")
            if row_dict.get("max_price"):
                text_parts.append(f"Max Price: {row_dict['max_price']} {row_dict.get('price_unit', '')}")
            if row_dict.get("arrivals"):
                text_parts.append(f"Arrivals: {row_dict['arrivals']} {row_dict.get('arrivals_unit', '')}")
            
            # Join all parts with newlines for readability
            row_text = "\n".join(text_parts)
            
            # Extract metadata
            metadata = {
                "source": file_path,
                "row": index,
                "category": row_dict.get("category"),
                "state_name": row_dict.get("state_name"),
                "district_name": row_dict.get("district_name"),
                "market_name": row_dict.get("market_name"),
                "variety": row_dict.get("variety"),
                "latitude": row_dict.get("latitude"),
                "longitude": row_dict.get("longitude"),
                "display_name": row_dict.get("display_name")
            }
            
            # Clean metadata (remove None values as some vector stores might complain)
            metadata = {k: v for k, v in metadata.items() if v is not None}
            
            # Create a Document object
            doc = Document(page_content=row_text, metadata=metadata)
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
