"""
PDF handler — extracts text AND embedded images from PDF files.

Uses PyMuPDF (fitz) which can extract both text and raster images.
Returns structured result for dual CLIP storage.
"""
from dataclasses import dataclass, field
from pathlib import Path
import fitz  # PyMuPDF


@dataclass
class PDFExtractResult:
	text: str = ""
	images: list[dict] = field(default_factory=list)
	# images: [{"bytes": b"...", "name": "page2_img1.png"}, ...]


def extract_from_pdf(file_path: str, min_image_size: int = 5000) -> PDFExtractResult:
	"""Extract text + embedded images from a PDF file.

	Args:
		file_path: Path to the PDF file.
		min_image_size: Minimum image byte size to extract (skip tiny icons/bullets).

	Returns:
		PDFExtractResult with combined text and list of image blobs.
	"""
	path = Path(file_path)
	if not path.exists():
		print(f"--- [ERROR] PDF file not found: {file_path} ---")
		return PDFExtractResult()

	text_parts: list[str] = []
	images: list[dict] = []
	img_counter = 0

	try:
		with fitz.open(file_path) as doc:
			for page_num, page in enumerate(doc, start=1):
				# --- Text extraction ---
				page_text = page.get_text()
				if page_text.strip():
					text_parts.append(page_text)

				# --- Image extraction ---
				for img_info in page.get_images(full=True):
					xref = img_info[0]
					try:
						base_image = doc.extract_image(xref)
						if not base_image:
							continue
						image_bytes = base_image["image"]
						# Skip tiny images (icons, bullets, decorations)
						if len(image_bytes) < min_image_size:
							continue
						ext = base_image.get("ext", "png")
						img_counter += 1
						img_name = f"page{page_num}_img{img_counter}.{ext}"
						images.append({"bytes": image_bytes, "name": img_name})
					except Exception as e:
						print(f"--- [WARN] Could not extract image xref={xref} on page {page_num}: {e} ---")

		clean_text = " ".join(" ".join(text_parts).split())
		print(f"--- [LOG] Extracted {len(doc)} pages, {len(images)} images from {path.name} ---")
		return PDFExtractResult(text=clean_text, images=images)

	except Exception as e:
		print(f"--- [ERROR] PDF processing failed {file_path}: {e} ---")
		return PDFExtractResult()


# Backward compat wrapper
def extract_text_from_pdf(file_path: str) -> str:
	"""Legacy API — returns text only."""
	return extract_from_pdf(file_path).text