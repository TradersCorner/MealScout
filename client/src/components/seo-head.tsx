import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  schemaData?: object;
  noIndex?: boolean;
}

export function SEOHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage = "/og-default.jpg",
  ogType = "website",
  schemaData,
  noIndex = false
}: SEOHeadProps) {
  useEffect(() => {
    // Set page title
    document.title = title;

    // Helper function to set meta tag
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Set canonical URL
    const setCanonical = (url: string) => {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", url);
    };

    // Basic meta tags
    setMetaTag("description", description);
    if (keywords) {
      setMetaTag("keywords", keywords);
    }
    
    // Robots meta
    if (noIndex) {
      setMetaTag("robots", "noindex, nofollow");
    } else {
      setMetaTag("robots", "index, follow");
    }

    // Open Graph tags
    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:type", ogType, true);
    setMetaTag("og:site_name", "MealScout", true);
    if (ogImage) {
      setMetaTag("og:image", ogImage, true);
    }
    if (canonicalUrl) {
      setMetaTag("og:url", canonicalUrl, true);
      setCanonical(canonicalUrl);
    }

    // Twitter Card tags
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
    if (ogImage) {
      setMetaTag("twitter:image", ogImage);
    }

    // Structured data (JSON-LD)
    if (schemaData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement("script");
        script.setAttribute("type", "application/ld+json");
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schemaData);
    }

    // Cleanup function
    return () => {
      // Optional: Clean up when component unmounts
      // Usually not needed for SPAs, but good practice
    };
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, schemaData, noIndex]);

  return null; // This component doesn't render anything
}