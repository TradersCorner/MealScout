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
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function ImageUploader(_a) {
    var _this = this;
    var uploadType = _a.uploadType, entityId = _a.entityId, currentImageUrl = _a.currentImageUrl, onUploadComplete = _a.onUploadComplete, _b = _a.aspectRatio, aspectRatio = _b === void 0 ? 'aspect-square' : _b, _c = _a.maxSizeMB, maxSizeMB = _c === void 0 ? 5 : _c;
    var _d = useState(currentImageUrl || null), preview = _d[0], setPreview = _d[1];
    var _e = useState(false), uploading = _e[0], setUploading = _e[1];
    var _f = useState(null), file = _f[0], setFile = _f[1];
    var fileInputRef = useRef(null);
    var toast = useToast().toast;
    var handleFileSelect = function (e) {
        var _a;
        var selectedFile = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!selectedFile)
            return;
        // Validate file type
        if (!selectedFile.type.startsWith('image/')) {
            toast({
                title: 'Invalid file type',
                description: 'Please select an image file (JPG, PNG, WebP)',
                variant: 'destructive',
            });
            return;
        }
        // Validate file size
        var sizeMB = selectedFile.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            toast({
                title: 'File too large',
                description: "Maximum file size is ".concat(maxSizeMB, "MB"),
                variant: 'destructive',
            });
            return;
        }
        setFile(selectedFile);
        // Create preview
        var reader = new FileReader();
        reader.onloadend = function () {
            setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
    };
    var handleUpload = function () { return __awaiter(_this, void 0, void 0, function () {
        var formData, response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!file)
                        return [2 /*return*/];
                    setUploading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    formData = new FormData();
                    formData.append('image', file);
                    if (entityId) {
                        if (uploadType === 'restaurant-logo' || uploadType === 'restaurant-cover') {
                            formData.append('restaurantId', entityId);
                        }
                        else if (uploadType === 'deal-image') {
                            formData.append('dealId', entityId);
                        }
                    }
                    return [4 /*yield*/, fetch("/api/upload/".concat(uploadType), {
                            method: 'POST',
                            body: formData,
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Upload failed');
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    toast({
                        title: 'Upload successful',
                        description: 'Your image has been uploaded',
                    });
                    setPreview(data.url);
                    onUploadComplete(data.url);
                    setFile(null);
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error('Upload error:', error_1);
                    toast({
                        title: 'Upload failed',
                        description: 'Failed to upload image. Please try again.',
                        variant: 'destructive',
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setUploading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleRemove = function () {
        setPreview(null);
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    return (<div className="space-y-4">
      <Card className="p-4">
        {preview ? (<div className="relative">
            <div className={"".concat(aspectRatio, " w-full overflow-hidden rounded-lg")}>
              <img src={preview} alt="Preview" className="h-full w-full object-cover"/>
            </div>
            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={handleRemove}>
              <X className="h-4 w-4"/>
            </Button>
          </div>) : (<div className={"".concat(aspectRatio, " w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors")} onClick={function () { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }}>
            <ImageIcon className="h-12 w-12 text-gray-400 mb-2"/>
            <p className="text-sm text-gray-600">Click to upload image</p>
            <p className="text-xs text-gray-400 mt-1">Max {maxSizeMB}MB</p>
          </div>)}
      </Card>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden"/>

      {file && !(preview === null || preview === void 0 ? void 0 : preview.startsWith('http')) && (<Button onClick={handleUpload} disabled={uploading} className="w-full">
          {uploading ? (<>
              <Upload className="mr-2 h-4 w-4 animate-spin"/>
              Uploading...
            </>) : (<>
              <Upload className="mr-2 h-4 w-4"/>
              Upload Image
            </>)}
        </Button>)}
    </div>);
}
