import * as pdfjsLib from "pdfjs-dist";

// Set worker source - dynamically use the same version as the main library
if (typeof window !== "undefined") {
  try {
    // Try using the version property from the library
    const version = (pdfjsLib as any).version || "4.10.38";
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    // Fallback to latest known compatible version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;
  }
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(" ");
      textParts.push(pageText);
    }

    return textParts.join("\n\n");
  } catch (error: any) {
    // Provide more helpful error message
    console.error("PDF parsing error:", error);
    throw new Error(
      error.message?.includes("worker") 
        ? "PDF worker failed to load. Please check your internet connection and try again."
        : `Failed to parse PDF: ${error.message || "Unknown error"}`
    );
  }
}
