type TabularResult = { headers: string[]; rows: string[][] };

const stripBom = (value: string) => value.replace(/^\uFEFF/, "");

const decodeBuffer = (buffer: Buffer) => {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString("utf16le", 2);
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.from(buffer);
    for (let i = 0; i + 1 < swapped.length; i += 2) {
      const tmp = swapped[i];
      swapped[i] = swapped[i + 1];
      swapped[i + 1] = tmp;
    }
    return swapped.toString("utf16le", 2);
  }
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    return buffer.toString("utf8", 3);
  }
  return buffer.toString("utf8");
};

const detectDelimiter = (text: string) => {
  const sample = text.slice(0, 20_000);
  const firstLine = sample.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
  const counts = [
    { d: ",", c: (firstLine.match(/,/g) || []).length },
    { d: "\t", c: (firstLine.match(/\t/g) || []).length },
    { d: ";", c: (firstLine.match(/;/g) || []).length },
    { d: "|", c: (firstLine.match(/\|/g) || []).length },
  ];
  counts.sort((a, b) => b.c - a.c);
  return counts[0]?.c ? counts[0].d : ",";
};

// Minimal CSV/TSV parser with quote support.
const parseDelimited = (text: string, delimiter: string): string[][] => {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // trim trailing empty line noise
    if (row.length === 1 && row[0].trim() === "") {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (ch === '"') {
      const next = text[i + 1];
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      pushField();
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      // handle CRLF
      if (ch === "\r" && text[i + 1] === "\n") {
        i += 1;
      }
      pushField();
      pushRow();
      continue;
    }

    field += ch;
  }

  pushField();
  if (row.length > 0) pushRow();

  return rows;
};

const findHeaderRowIndex = (rows: string[][]) => {
  let bestIndex = 0;
  let bestScore = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i += 1) {
    const candidate = rows[i] || [];
    const nonEmpty = candidate.filter((c) => String(c || "").trim().length > 0);
    if (nonEmpty.length === 0) continue;
    // Prefer rows that look like headers (mostly non-numeric).
    const numericCount = nonEmpty.filter((c) => /^\s*-?\d+(\.\d+)?\s*$/.test(c)).length;
    const score = nonEmpty.length - numericCount;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
};

export async function parseTabularFile(buffer: Buffer, fileName: string): Promise<TabularResult> {
  const lower = String(fileName || "").toLowerCase();

  if (lower.endsWith(".xlsx")) {
    const imported = await import("exceljs");
    const ExcelJS: any = (imported as any)?.default ?? imported;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return { headers: [], rows: [] };

    const rows: string[][] = [];
    worksheet.eachRow((row: any) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      rows.push(
        values.map((cell: any) => {
          if (cell == null) return "";
          if (typeof cell === "object" && "text" in cell) return String(cell.text);
          if (typeof cell === "object" && "richText" in cell) {
            return String(cell.richText?.map((part: any) => part.text).join("") || "");
          }
          return String(cell);
        }),
      );
    });
    if (rows.length === 0) return { headers: [], rows: [] };
    const headerIndex = findHeaderRowIndex(rows);
    const headers = (rows[headerIndex] || []).map((h, idx) => {
      const trimmed = stripBom(String(h || "").trim());
      return idx === 0 ? stripBom(trimmed) : trimmed;
    });
    return { headers, rows: rows.slice(headerIndex + 1) };
  }

  if (lower.endsWith(".xls")) {
    throw new Error("Legacy .xls files are not supported. Save as .xlsx, .csv, or .tsv.");
  }

  const text = decodeBuffer(buffer);
  const delimiter = lower.endsWith(".tsv") ? "\t" : detectDelimiter(text);
  const rows = parseDelimited(text, delimiter);
  if (rows.length === 0) return { headers: [], rows: [] };
  const headerIndex = findHeaderRowIndex(rows);
  const headers = (rows[headerIndex] || []).map((h) => stripBom(String(h || "").trim()));
  return { headers, rows: rows.slice(headerIndex + 1) };
}

