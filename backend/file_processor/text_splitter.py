from langchain_text_splitters import RecursiveCharacterTextSplitter

def split_text(text: str, chunk_size=500, chunk_overlap=50):
    """
    Splits long text into smaller semantically meaningful chunks.
    English-optimized splitting logic for 'From Chaos to Clarity'.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
    )
    return splitter.split_text(text)