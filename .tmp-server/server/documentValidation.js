var ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
var MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
var MAX_FILES = 5;
export function validateDocuments(documents) {
    var errors = [];
    // Check document count
    if (documents.length === 0) {
        errors.push({
            field: 'documents',
            message: 'At least one document is required'
        });
        return { valid: false, errors: errors };
    }
    if (documents.length > MAX_FILES) {
        errors.push({
            field: 'documents',
            message: "Maximum ".concat(MAX_FILES, " documents allowed, got ").concat(documents.length)
        });
        return { valid: false, errors: errors };
    }
    // Validate each document
    documents.forEach(function (document, index) {
        var docErrors = validateSingleDocument(document, index);
        errors.push.apply(errors, docErrors);
    });
    return {
        valid: errors.length === 0,
        errors: errors
    };
}
function validateSingleDocument(document, index) {
    var errors = [];
    var fieldName = "documents[".concat(index, "]");
    // Check if it's a data URL
    if (!document.startsWith('data:')) {
        errors.push({
            field: fieldName,
            message: 'Document must be a valid data URL'
        });
        return errors;
    }
    try {
        // Parse data URL to get MIME type and size
        var _a = document.split(','), header = _a[0], base64Data = _a[1];
        if (!header || !base64Data) {
            errors.push({
                field: fieldName,
                message: 'Invalid data URL format'
            });
            return errors;
        }
        // Extract MIME type
        var mimeMatch = header.match(/data:([^;]+)/);
        if (!mimeMatch) {
            errors.push({
                field: fieldName,
                message: 'Could not determine file type'
            });
            return errors;
        }
        var mimeType = mimeMatch[1].toLowerCase();
        // Validate MIME type
        if (!ACCEPTED_MIME_TYPES.includes(mimeType)) {
            errors.push({
                field: fieldName,
                message: "File type '".concat(mimeType, "' not allowed. Allowed types: ").concat(ACCEPTED_MIME_TYPES.join(', '))
            });
        }
        // Validate file size (base64 is ~33% larger than original)
        var approximateSize = (base64Data.length * 3) / 4;
        if (approximateSize > MAX_FILE_SIZE_BYTES) {
            var sizeMB = Math.round(approximateSize / (1024 * 1024) * 100) / 100;
            var maxSizeMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
            errors.push({
                field: fieldName,
                message: "File size ".concat(sizeMB, "MB exceeds maximum allowed size of ").concat(maxSizeMB, "MB")
            });
        }
        // Additional base64 validation
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
            errors.push({
                field: fieldName,
                message: 'Invalid base64 encoding'
            });
        }
    }
    catch (error) {
        errors.push({
            field: fieldName,
            message: 'Failed to validate document format'
        });
    }
    return errors;
}
// Rate limiting utilities (simple in-memory store)
var submissionAttempts = new Map();
export function checkRateLimit(restaurantId) {
    var now = Date.now();
    var oneHour = 60 * 60 * 1000;
    // Get existing attempts for this restaurant
    var attempts = submissionAttempts.get(restaurantId) || [];
    // Remove attempts older than 1 hour
    var recentAttempts = attempts.filter(function (timestamp) { return now - timestamp < oneHour; });
    // Update the map with cleaned attempts
    submissionAttempts.set(restaurantId, recentAttempts);
    // Check if rate limit exceeded
    if (recentAttempts.length >= 1) { // Max 1 request per hour
        var oldestAttempt = Math.min.apply(Math, recentAttempts);
        var nextAllowedTime = new Date(oldestAttempt + oneHour);
        return {
            allowed: false,
            nextAllowedTime: nextAllowedTime
        };
    }
    // Record this attempt
    recentAttempts.push(now);
    submissionAttempts.set(restaurantId, recentAttempts);
    return { allowed: true };
}
// Clean up old rate limit entries periodically
setInterval(function () {
    var now = Date.now();
    var oneHour = 60 * 60 * 1000;
    for (var _i = 0, _a = Array.from(submissionAttempts.entries()); _i < _a.length; _i++) {
        var _b = _a[_i], restaurantId = _b[0], attempts = _b[1];
        var recentAttempts = attempts.filter(function (timestamp) { return now - timestamp < oneHour; });
        if (recentAttempts.length === 0) {
            submissionAttempts.delete(restaurantId);
        }
        else {
            submissionAttempts.set(restaurantId, recentAttempts);
        }
    }
}, 15 * 60 * 1000); // Clean up every 15 minutes
