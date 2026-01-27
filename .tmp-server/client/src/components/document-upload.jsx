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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Image, Eye, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
var ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
var MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
var MAX_FILES = 5;
export default function DocumentUpload(_a) {
    var _this = this;
    var onDocumentsChange = _a.onDocumentsChange, _b = _a.maxFiles, maxFiles = _b === void 0 ? MAX_FILES : _b, _c = _a.maxFileSize, maxFileSize = _c === void 0 ? MAX_FILE_SIZE : _c, _d = _a.acceptedTypes, acceptedTypes = _d === void 0 ? ACCEPTED_TYPES : _d, className = _a.className;
    var _e = useState([]), documents = _e[0], setDocuments = _e[1];
    var _f = useState(false), dragOver = _f[0], setDragOver = _f[1];
    var _g = useState(false), isUploading = _g[0], setIsUploading = _g[1];
    var _h = useState(null), previewDocument = _h[0], setPreviewDocument = _h[1];
    var fileInputRef = useRef(null);
    var toast = useToast().toast;
    var formatFileSize = function (bytes) {
        if (bytes === 0)
            return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    var validateFile = function (file) {
        if (!acceptedTypes.includes(file.type)) {
            return {
                valid: false,
                error: "File type ".concat(file.type, " is not supported. Please upload JPG, PNG, or PDF files.")
            };
        }
        if (file.size > maxFileSize) {
            return {
                valid: false,
                error: "File size ".concat(formatFileSize(file.size), " exceeds the maximum limit of ").concat(formatFileSize(maxFileSize), ".")
            };
        }
        if (documents.length >= maxFiles) {
            return {
                valid: false,
                error: "Maximum ".concat(maxFiles, " files allowed.")
            };
        }
        return { valid: true };
    };
    var convertToBase64 = function (file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () { return resolve(reader.result); };
            reader.onerror = function (error) { return reject(error); };
            reader.readAsDataURL(file);
        });
    };
    var processFiles = useCallback(function (files) { return __awaiter(_this, void 0, void 0, function () {
        var fileArray, newDocuments, _i, fileArray_1, file, validation, dataUrl, docType, document_1, error_1, updatedDocuments;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsUploading(true);
                    fileArray = Array.from(files);
                    newDocuments = [];
                    _i = 0, fileArray_1 = fileArray;
                    _a.label = 1;
                case 1:
                    if (!(_i < fileArray_1.length)) return [3 /*break*/, 6];
                    file = fileArray_1[_i];
                    validation = validateFile(file);
                    if (!validation.valid) {
                        toast({
                            title: "Upload Error",
                            description: validation.error,
                            variant: "destructive",
                        });
                        return [3 /*break*/, 5];
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, convertToBase64(file)];
                case 3:
                    dataUrl = _a.sent();
                    docType = file.type.startsWith('image/') ? 'image' : 'pdf';
                    document_1 = {
                        id: "".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)),
                        file: file,
                        dataUrl: dataUrl,
                        type: docType,
                        size: file.size,
                        name: file.name,
                    };
                    newDocuments.push(document_1);
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    toast({
                        title: "Upload Error",
                        description: "Failed to process file: ".concat(file.name),
                        variant: "destructive",
                    });
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    if (newDocuments.length > 0) {
                        updatedDocuments = __spreadArray(__spreadArray([], documents, true), newDocuments, true);
                        setDocuments(updatedDocuments);
                        onDocumentsChange(updatedDocuments.map(function (doc) { return doc.dataUrl; }));
                        toast({
                            title: "Upload Successful",
                            description: "".concat(newDocuments.length, " file(s) uploaded successfully."),
                        });
                    }
                    setIsUploading(false);
                    return [2 /*return*/];
            }
        });
    }); }, [documents, onDocumentsChange, toast, maxFiles, maxFileSize, acceptedTypes]);
    var removeDocument = function (id) {
        var updatedDocuments = documents.filter(function (doc) { return doc.id !== id; });
        setDocuments(updatedDocuments);
        onDocumentsChange(updatedDocuments.map(function (doc) { return doc.dataUrl; }));
        toast({
            title: "File Removed",
            description: "Document has been removed from upload list.",
        });
    };
    var handleDragOver = function (e) {
        e.preventDefault();
        setDragOver(true);
    };
    var handleDragLeave = function (e) {
        e.preventDefault();
        setDragOver(false);
    };
    var handleDrop = function (e) {
        e.preventDefault();
        setDragOver(false);
        var files = e.dataTransfer.files;
        if (files.length > 0) {
            processFiles(files);
        }
    };
    var handleFileInputChange = function (e) {
        var files = e.target.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
        // Reset the input value to allow uploading the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    var openFileDialog = function () {
        var _a;
        (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
    };
    return (<div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5"/>
            <span>Upload Business Documents</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn("border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer", dragOver
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400")} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={openFileDialog} data-testid="upload-dropzone">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
            <div className="space-y-2">
              <p className="text-lg font-medium">Drop files here or click to upload</p>
              <p className="text-sm text-gray-500">
                Supported formats: JPG, PNG, PDF (max {formatFileSize(maxFileSize)} each)
              </p>
              <p className="text-xs text-gray-400">
                Maximum {maxFiles} files allowed
              </p>
            </div>
          </div>

          <input ref={fileInputRef} type="file" multiple accept={acceptedTypes.join(',')} onChange={handleFileInputChange} className="hidden" data-testid="file-input"/>

          {isUploading && (<div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"/>
              <span>Processing files...</span>
            </div>)}
        </CardContent>
      </Card>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (<Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Uploaded Documents ({documents.length}/{maxFiles})</span>
              <Badge variant="secondary">{formatFileSize(documents.reduce(function (acc, doc) { return acc + doc.size; }, 0))}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map(function (doc) { return (<div key={doc.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50" data-testid={"document-item-".concat(doc.id)}>
                  <div className="flex-shrink-0">
                    {doc.type === 'image' ? (<Image className="w-6 h-6 text-blue-500"/>) : (<FileText className="w-6 h-6 text-red-500"/>)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={function () { return setPreviewDocument(doc); }} data-testid={"preview-button-".concat(doc.id)}>
                      <Eye className="w-4 h-4"/>
                    </Button>
                    <Button size="sm" variant="outline" onClick={function () { return removeDocument(doc.id); }} data-testid={"remove-button-".concat(doc.id)}>
                      <X className="w-4 h-4"/>
                    </Button>
                  </div>
                </div>); })}
            </div>

            {documents.length === maxFiles && (<div className="mt-4 flex items-center space-x-2 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4"/>
                <span>Maximum file limit reached. Remove files to upload more.</span>
              </div>)}
          </CardContent>
        </Card>)}

      {/* Preview Modal */}
      {previewDocument && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={function () { return setPreviewDocument(null); }} data-testid="preview-modal">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto" onClick={function (e) { return e.stopPropagation(); }}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">{previewDocument.name}</h3>
              <Button size="sm" variant="outline" onClick={function () { return setPreviewDocument(null); }} data-testid="close-preview">
                <X className="w-4 h-4"/>
              </Button>
            </div>
            <div className="p-4">
              {previewDocument.type === 'image' ? (<img src={previewDocument.dataUrl} alt={previewDocument.name} className="max-w-full h-auto" data-testid="preview-image"/>) : (<div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4"/>
                  <p className="text-lg font-medium">PDF Preview</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {previewDocument.name} - {formatFileSize(previewDocument.size)}
                  </p>
                  <p className="text-xs text-gray-400 mt-4">
                    PDF files will be processed when you submit the verification request
                  </p>
                </div>)}
            </div>
          </div>
        </div>)}
    </div>);
}
