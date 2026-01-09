import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOFAQProps {
  items: FAQItem[];
  title?: string;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * SEO-optimized FAQ component
 * 
 * Renders FAQs in crawlable HTML with optional collapsed UI
 * Satisfies SEO + LLMO requirements while minimizing UX clutter
 */
export function SEOFAQ({ items, title = "Frequently Asked Questions", defaultExpanded = false, className = "" }: SEOFAQProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(
    defaultExpanded ? new Set(items.map((_, i) => i)) : new Set()
  );

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <section className={`seo-faq ${className}`} itemScope itemType="https://schema.org/FAQPage">
      <h2 className="text-xl font-bold mb-4 text-gray-900">{title}</h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              aria-expanded={expandedItems.has(index)}
            >
              <h3 itemProp="name" className="font-semibold text-gray-900 pr-4">
                {item.question}
              </h3>
              {expandedItems.has(index) ? (
                <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
              )}
            </button>
            <div
              itemScope
              itemProp="acceptedAnswer"
              itemType="https://schema.org/Answer"
              className={`px-4 transition-all duration-200 ${
                expandedItems.has(index) ? "pb-3 max-h-96" : "max-h-0 overflow-hidden"
              }`}
            >
              <div itemProp="text" className="text-gray-700 leading-relaxed">
                {item.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Minimal FAQ component - always visible, minimal styling
 * For pages where FAQs should be crawlable but not prominent
 */
export function MinimalFAQ({ items, title = "Common Questions", className = "" }: SEOFAQProps) {
  return (
    <section className={`minimal-faq text-sm text-gray-600 ${className}`} itemScope itemType="https://schema.org/FAQPage">
      <h3 className="font-medium text-gray-700 mb-3">{title}</h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h4 itemProp="name" className="font-medium text-gray-800 mb-1">
              {item.question}
            </h4>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text" className="text-gray-600 leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
