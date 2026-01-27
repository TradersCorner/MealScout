import { useEffect } from "react";
export function SEOHead(_a) {
    var title = _a.title, description = _a.description, keywords = _a.keywords, canonicalUrl = _a.canonicalUrl, _b = _a.ogImage, ogImage = _b === void 0 ? "/og-default.jpg" : _b, _c = _a.ogType, ogType = _c === void 0 ? "website" : _c, schemaData = _a.schemaData, _d = _a.noIndex, noIndex = _d === void 0 ? false : _d;
    useEffect(function () {
        // Set page title
        document.title = title;
        // Helper function to set meta tag
        var setMetaTag = function (name, content, isProperty) {
            if (isProperty === void 0) { isProperty = false; }
            var attribute = isProperty ? "property" : "name";
            var meta = document.querySelector("meta[".concat(attribute, "=\"").concat(name, "\"]"));
            if (!meta) {
                meta = document.createElement("meta");
                meta.setAttribute(attribute, name);
                document.head.appendChild(meta);
            }
            meta.setAttribute("content", content);
        };
        // Set canonical URL
        var setCanonical = function (url) {
            var link = document.querySelector('link[rel="canonical"]');
            if (!link) {
                link = document.createElement("link");
                link.setAttribute("rel", "canonical");
                document.head.appendChild(link);
            }
            link.setAttribute("href", url);
        };
        var resolvedCanonical = canonicalUrl ||
            (typeof window !== "undefined"
                ? "".concat(window.location.origin).concat(window.location.pathname).concat(window.location.search)
                : undefined);
        var resolveOgImage = function (imageUrl) {
            if (!imageUrl)
                return "";
            if (imageUrl.startsWith("http"))
                return imageUrl;
            if (typeof window === "undefined")
                return imageUrl;
            return "".concat(window.location.origin).concat(imageUrl.startsWith("/") ? "" : "/").concat(imageUrl);
        };
        var resolvedOgImage = ogImage ? resolveOgImage(ogImage) : "";
        // Basic meta tags
        setMetaTag("description", description);
        if (keywords) {
            setMetaTag("keywords", keywords);
        }
        // Robots meta
        if (noIndex) {
            setMetaTag("robots", "noindex, nofollow");
        }
        else {
            setMetaTag("robots", "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");
        }
        // Open Graph tags
        setMetaTag("og:title", title, true);
        setMetaTag("og:description", description, true);
        setMetaTag("og:type", ogType, true);
        setMetaTag("og:site_name", "MealScout", true);
        if (resolvedOgImage) {
            setMetaTag("og:image", resolvedOgImage, true);
        }
        if (resolvedCanonical) {
            setMetaTag("og:url", resolvedCanonical, true);
            setCanonical(resolvedCanonical);
        }
        // Twitter Card tags
        setMetaTag("twitter:card", "summary_large_image");
        setMetaTag("twitter:title", title);
        setMetaTag("twitter:description", description);
        setMetaTag("twitter:site", "@mealscout");
        if (resolvedOgImage) {
            setMetaTag("twitter:image", resolvedOgImage);
        }
        // Structured data (JSON-LD)
        var pageSchema = null;
        if (schemaData) {
            // Remove any existing page-specific schema
            var existingPageSchema = document.querySelector('script[type="application/ld+json"][data-page-schema="true"]');
            if (existingPageSchema) {
                existingPageSchema.remove();
            }
            // Create new page-specific schema
            pageSchema = document.createElement("script");
            pageSchema.setAttribute("type", "application/ld+json");
            pageSchema.setAttribute("data-page-schema", "true");
            pageSchema.textContent = JSON.stringify(schemaData);
            document.head.appendChild(pageSchema);
        }
        // Cleanup function
        return function () {
            // Optional: Clean up when component unmounts
            // Usually not needed for SPAs, but good practice
        };
    }, [title, description, keywords, canonicalUrl, ogImage, ogType, schemaData, noIndex]);
    return null; // This component doesn't render anything
}
