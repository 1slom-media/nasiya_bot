function extractDate(datetime) {
    // Agar datetime Date obyekti bo'lsa, uni stringga aylantiramiz
    if (datetime instanceof Date) {
      datetime = datetime.toISOString(); // ISO formatda stringga aylantiramiz
    }
  
    return datetime.split("T")[0]; // 'T' belgisi bo'yicha bo'linadi va faqat sana olinadi
  }
  
  export { extractDate };
  