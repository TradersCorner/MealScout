var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var FIELD_ALIASES = {
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
var normalizeHeader = function (value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};
var mapHeaderToField = function (header) {
    var normalized = normalizeHeader(header);
    for (var _i = 0, _a = Object.entries(FIELD_ALIASES); _i < _a.length; _i++) {
        var _b = _a[_i], field = _b[0], aliases = _b[1];
        if (aliases.some(function (alias) { return normalized === normalizeHeader(alias); })) {
            return field;
        }
    }
    return null;
};
var parseCsvToRows = function (text) {
    var rows = [];
    var row = [];
    var value = "";
    var inQuotes = false;
    for (var i = 0; i < text.length; i += 1) {
        var char = text[i];
        var next = text[i + 1];
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
                if (row.some(function (cell) { return cell.trim() !== ""; })) {
                    rows.push(row);
                }
                row = [];
            }
            continue;
        }
        value += char;
    }
    row.push(value);
    if (row.some(function (cell) { return cell.trim() !== ""; })) {
        rows.push(row);
    }
    return rows;
};
var buildRowData = function (headers, row) {
    var rawData = {};
    headers.forEach(function (header, index) {
        var _a, _b;
        rawData[header] = (_b = (_a = row[index]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
    });
    var mapped = { rawData: rawData };
    headers.forEach(function (header, index) {
        var _a;
        var field = mapHeaderToField(header);
        if (!field)
            return;
        var value = (_a = row[index]) === null || _a === void 0 ? void 0 : _a.trim();
        if (!value)
            return;
        mapped[field] = value;
    });
    return mapped;
};
var computeConfidenceScore = function (row) {
    var score = 0;
    if (row.externalId)
        score += 50;
    if (row.name)
        score += 20;
    if (row.address)
        score += 15;
    if (row.phone)
        score += 10;
    if (row.city && row.state)
        score += 5;
    return Math.min(score, 100);
};
export var parseTruckImportFile = function (buffer, fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var lowerName, rows, xlsx, _a, workbook, sheetName, sheet, text, headers, dataRows, parsedRows;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                lowerName = fileName.toLowerCase();
                rows = [];
                if (!(lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls"))) return [3 /*break*/, 5];
                xlsx = void 0;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, import("xlsx")];
            case 2:
                xlsx = _b.sent();
                return [3 /*break*/, 4];
            case 3:
                _a = _b.sent();
                throw new Error("XLSX parsing requires the xlsx package.");
            case 4:
                workbook = xlsx.read(buffer, { type: "buffer" });
                sheetName = workbook.SheetNames[0];
                if (!sheetName) {
                    return [2 /*return*/, { rows: [], headers: [] }];
                }
                sheet = workbook.Sheets[sheetName];
                rows = xlsx.utils.sheet_to_json(sheet, {
                    header: 1,
                    defval: "",
                    raw: false,
                });
                return [3 /*break*/, 6];
            case 5:
                text = buffer.toString("utf8");
                rows = parseCsvToRows(text);
                _b.label = 6;
            case 6:
                if (rows.length === 0) {
                    return [2 /*return*/, { rows: [], headers: [] }];
                }
                headers = rows[0].map(function (header) { return header.trim(); });
                dataRows = rows.slice(1);
                parsedRows = dataRows
                    .map(function (row) { return buildRowData(headers, row); })
                    .map(function (row) { return (__assign(__assign({}, row), { externalId: row.externalId || null, name: row.name || null, address: row.address || null, city: row.city || null, state: row.state || null, phone: row.phone || null, cuisineType: row.cuisineType || null, websiteUrl: row.websiteUrl || null, instagramUrl: row.instagramUrl || null, facebookPageUrl: row.facebookPageUrl || null, latitude: row.latitude || null, longitude: row.longitude || null, rawData: row.rawData, confidenceScore: computeConfidenceScore(row) })); });
                return [2 /*return*/, { rows: parsedRows, headers: headers }];
        }
    });
}); };
