/**
 * Schema.org structured data helpers
 * Generates machine-readable markup for SEO and LLMO
 */
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
/**
 * Generate FoodEstablishment schema for restaurant pages
 */
export function generateRestaurantSchema(restaurant) {
    var schema = {
        "@context": "https://schema.org",
        "@type": "FoodEstablishment",
        name: restaurant.name,
        identifier: restaurant.id,
    };
    if (restaurant.address || restaurant.city) {
        schema.address = __assign(__assign(__assign(__assign(__assign({ "@type": "PostalAddress" }, (restaurant.address && { streetAddress: restaurant.address })), (restaurant.city && { addressLocality: restaurant.city })), (restaurant.state && { addressRegion: restaurant.state })), (restaurant.zipCode && { postalCode: restaurant.zipCode })), { addressCountry: "US" });
    }
    if (restaurant.phone) {
        schema.telephone = restaurant.phone;
    }
    if (restaurant.cuisineType) {
        schema.servesCuisine = restaurant.cuisineType;
    }
    if (restaurant.imageUrl) {
        schema.image = restaurant.imageUrl;
    }
    if (restaurant.rating && restaurant.reviewCount) {
        schema.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: restaurant.rating,
            reviewCount: restaurant.reviewCount,
            bestRating: "5",
            worstRating: "1",
        };
    }
    if (restaurant.priceRange) {
        schema.priceRange = "$".repeat(restaurant.priceRange);
    }
    return schema;
}
/**
 * Generate Offer schema for deal pages
 */
export function generateDealSchema(deal, restaurantName) {
    var schema = {
        "@context": "https://schema.org",
        "@type": "Offer",
        name: deal.title,
        description: deal.description,
        identifier: deal.id,
        validFrom: deal.startDate,
    };
    if (deal.endDate) {
        schema.validThrough = deal.endDate;
    }
    if (deal.discountValue) {
        schema.priceSpecification = {
            "@type": "PriceSpecification",
            description: deal.discountValue,
        };
    }
    if (restaurantName || deal.restaurantName) {
        schema.seller = {
            "@type": "FoodEstablishment",
            name: restaurantName || deal.restaurantName,
        };
    }
    schema.availability = "https://schema.org/InStock";
    return schema;
}
/**
 * Generate VideoObject schema for recommendation videos
 */
export function generateVideoSchema(video) {
    var schema = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: video.title,
        identifier: video.id,
        uploadDate: video.uploadDate,
    };
    if (video.description) {
        schema.description = video.description;
    }
    if (video.thumbnailUrl) {
        schema.thumbnailUrl = video.thumbnailUrl;
    }
    if (video.videoUrl) {
        schema.contentUrl = video.videoUrl;
    }
    if (video.duration) {
        // Convert seconds to ISO 8601 duration format (PT#S)
        schema.duration = "PT".concat(video.duration, "S");
    }
    if (video.transcript) {
        schema.transcript = video.transcript;
    }
    if (video.creatorName) {
        schema.creator = {
            "@type": "Person",
            name: video.creatorName,
        };
    }
    return schema;
}
/**
 * Generate ItemList schema for listing pages (cuisine, location)
 */
export function generateItemListSchema(items, listName) {
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: listName,
        numberOfItems: items.length,
        itemListElement: items.map(function (item, index) { return (__assign({ "@type": "ListItem", position: index + 1, name: item.name }, (item.url && { url: item.url }))); }),
    };
}
/**
 * Inject schema into page head
 */
export function injectSchema(schema) {
    if (typeof window === "undefined")
        return;
    var scriptId = "structured-data";
    var script = document.getElementById(scriptId);
    if (!script) {
        var newScript = document.createElement("script");
        newScript.id = scriptId;
        newScript.type = "application/ld+json";
        document.head.appendChild(newScript);
        script = newScript;
    }
    script.textContent = JSON.stringify(schema);
}
