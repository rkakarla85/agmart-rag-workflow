from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.chains import RetrievalQA
import os
from dotenv import load_dotenv

load_dotenv()

DB_DIR = "chroma_db"

def get_vector_store():
    # Ensure API key is set
    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY not found in environment variables")
        
    embeddings = OpenAIEmbeddings() 
    vector_store = Chroma(persist_directory=DB_DIR, embedding_function=embeddings)
    return vector_store

def query_rag(question: str) -> str:
    """
    Queries the RAG system with a question.
    """
    try:
        vector_store = get_vector_store()
        llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
        
        # Create a retriever
        retriever = vector_store.as_retriever(search_kwargs={"k": 5})
        
        # Create the QA chain
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm, 
            chain_type="stuff", 
            retriever=retriever,
            return_source_documents=False
        )
        
        result = qa_chain.invoke({"query": question})
        return result["result"]
    except Exception as e:
        return f"Error querying RAG: {str(e)}"
