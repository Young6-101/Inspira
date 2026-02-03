import fitz  # PyMuPDF library

def extract_text_from_pdf(file_path):
    """
    Extracts raw text from a PDF file and performs basic cleaning.
    Purpose: Converting 'Chaos' (raw PDF) into 'Clarity' (clean text).
    """
    text = ""
    try:
        # Open the PDF document
        with fitz.open(file_path) as doc:
            for page in doc:
                # Extract text from each page
                text += page.get_text()
        
        # Basic cleaning: remove extra whitespaces and maintain flow
        clean_text = " ".join(text.split())
        return clean_text
        
    except Exception as e:
        print(f"Error processing PDF {file_path}: {e}")
        return ""