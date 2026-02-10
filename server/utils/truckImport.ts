type ParsedTruckRow = {
  externalId?: string | null;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  cuisineType?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookPageUrl?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  confidenceScore?: number;
  rawData: Record<string, string>;
};

const FIELD_ALIASES: Record<string, string[]> = {
  externalId: [
    "license",
    "license id",
    "license number",
    "permit",
    "permit id",
    "permit number",
    "registration",
    "registration id",
    "registry id",
    "business id",
    "id",
  ],
  name: ["name", "business name", "truck name", "vendor name"],
  address: ["address", "street", "street address", "address1"],
  city: ["city", "town"],
  state: ["state", "st", "province"],
  phone: ["phone", "phone number", "telephone", "tel"],
  cuisineType: ["cuisine", "category", "type"],
  websiteUrl: ["website", "website url", "url", "site"],
  instagramUrl: ["instagram", "instagram url", "ig", "ig url"],
  facebookPageUrl: ["facebook", "facebook url", "fb", "fb url"],
  latitude: ["lat", "latitude"],
  longitude: ["lng", "longitude", "lon"],
};

const normalizeHeader = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const mapHeaderToField = (header: string): string | null => {
  const normalized = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((alias) => normalized === normalizeHeader(alias))) {
      return field;
    }
  }
  return null;
};

const parseCsvToRows = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && (char === "," || char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(value);
      value = "";
      if (char === "\n" || char === "\r") {
        if (row.some((cell) => cell.trim() !== "")) {
          rows.push(row);
        }
        row = [];
      }
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  return rows;
};

const buildRowData = (
  headers: string[],
  row: string[],
): ParsedTruckRow => {
  const rawData: Record<string, string> = {};
  headers.forEach((header, index) => {
    rawData[header] = row[index]?.trim() ?? "";
  });

  const mapped: ParsedTruckRow = { rawData };
  headers.forEach((header, index) => {
    const field = mapHeaderToField(header);
    if (!field) return;
    const value = row[index]?.trim();
    if (!value) return;
    (mapped as unknown as Record<string, string | null>)[field] = value;
  });

  return mapped;
};

const computeConfidenceScore = (row: ParsedTruckRow): number => {
  let score = 0;
  if (row.externalId) score += 50;
  if (row.name) score += 20;
  if (row.address) score += 15;
  if (row.phone) score += 10;
  if (row.city && row.state) score += 5;
  return Math.min(score, 100);
};

export const parseTruckImportFile = async (
  buffer: Buffer,
  fileName: string,
): Promise<{ rows: ParsedTruckRow[]; headers: string[] }> => {
  const lowerName = fileName.toLowerCase();
  let rows: string[][] = [];

  if (lowerName.endsWith(".xlsx")) {
    let ExcelJS: any;
    try {
      const imported = await import("exceljs");
      ExcelJS = (imported as any)?.default ?? imported;
    } catch {
      throw new Error("XLSX parsing requires the exceljs package.");
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return { rows: [], headers: [] };
    }

    rows = [];
    worksheet.eachRow((row: any) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      rows.push(
        values.map((cell: any) => {
          if (cell == null) return "";
          if (typeof cell === "object" && "text" in cell) {
            return String(cell.text);
          }
          if (typeof cell === "object" && "richText" in cell) {
            return String(
              cell.richText?.map((part: any) => part.text).join("") || "",
            );
          }
          return String(cell);
        }),
      );
    });
  } else if (lowerName.endsWith(".xls")) {
    throw new Error("Legacy .xls files are no longer supported. Save as .xlsx or .csv.");
  } else {
    // Excel often exports CSV as UTF-16LE with a BOM. Try to decode that correctly.
    const text = (() => {
      if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
        return buffer.toString("utf16le", 2);
      }
      if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
        // Convert UTF-16BE to LE by swapping bytes.
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
    })();
    rows = parseCsvToRows(text);
  }

  if (rows.length === 0) {
    return { rows: [], headers: [] };
  }

  const headers = rows[0].map((header, index) => {
    const trimmed = header.trim();
    // Strip BOM that can appear on the first header cell.
    return index === 0 ? trimmed.replace(/^\uFEFF/, "").trim() : trimmed;
  });
  const dataRows = rows.slice(1);
  const parsedRows = dataRows
    .map((row) => buildRowData(headers, row))
    .map((row) => ({
      ...row,
      externalId: row.externalId || null,
      name: row.name || null,
      address: row.address || null,
      city: row.city || null,
      state: row.state || null,
      phone: row.phone || null,
      cuisineType: row.cuisineType || null,
      websiteUrl: row.websiteUrl || null,
      instagramUrl: row.instagramUrl || null,
      facebookPageUrl: row.facebookPageUrl || null,
      latitude: row.latitude || null,
      longitude: row.longitude || null,
      rawData: row.rawData,
      confidenceScore: computeConfidenceScore(row),
    }));

  return { rows: parsedRows, headers };
};
