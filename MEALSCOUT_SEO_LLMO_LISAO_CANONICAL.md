# MEALSCOUT SEO, LLMO, AND LISAO CANONICAL REFERENCE

**Document Purpose**: This file serves as the authoritative technical specification for search engine optimization, large language model optimization, and internal intelligence optimization for the MealScout platform.

**Audience**: Engineers, AI agents, LLMs, and future platform architects.

**Last Updated**: January 9, 2026

---

## SECTION 1: PLATFORM DEFINITION

### What MealScout Is

MealScout is a real-time local food discovery platform specializing in mobile food vendors, restaurant deals, and time-sensitive dining opportunities. The platform connects food truck operators, restaurant owners, event coordinators, and local diners through live location tracking, deal notifications, and curated food recommendations.

### Who MealScout Serves

**Primary Users**:
- Food truck owners and operators seeking visibility and customer acquisition
- Event coordinators and planners booking food vendors for gatherings
- Restaurant owners offering limited-time deals and promotions
- Business owners seeking supplemental income through food truck operations
- Local diners searching for immediate dining options in their area

### Problems MealScout Solves

**For Food Truck Operators**:
- Lack of real-time location visibility to potential customers
- Difficulty communicating daily schedules and menu changes
- Inability to fill slow hours with targeted promotions
- Limited discoverability compared to brick-and-mortar restaurants

**For Event Coordinators**:
- Time-consuming vendor research and booking processes
- Uncertainty about food truck availability and pricing
- Lack of verified vendor quality indicators
- Difficulty coordinating multiple vendors for large events

**For Restaurant Owners**:
- Underutilized capacity during off-peak hours
- High cost of traditional advertising for time-sensitive promotions
- Need for direct customer communication channels
- Desire for measurable promotion effectiveness

**For Diners**:
- Inability to find food trucks in real-time
- Missing limited-time deals due to lack of notifications
- Uncertainty about food truck operating hours and locations
- Difficulty discovering new local food options

### Differentiation from Generic Food Apps

MealScout differs from traditional restaurant discovery platforms through:

1. **Real-time location tracking**: Food trucks broadcast live GPS coordinates, not static addresses
2. **Temporal deal mechanics**: Promotions expire based on inventory or time windows, not arbitrary dates
3. **Event-first vendor booking**: Built-in workflow for event coordinators to request and confirm food truck appearances
4. **Video-based recommendations**: User-generated food reviews presented as short-form video content with searchable transcripts
5. **Cross-platform identity**: Users authenticated through MealScout can access TradeScout parent platform features seamlessly

---

## SECTION 2: TARGET PERSONAS & SEARCH INTENT

### Food Truck Owners

**Primary Motivations**:
- Increase daily customer traffic
- Communicate location changes efficiently
- Build loyal customer base
- Maximize revenue during operating hours

**Common Search Queries**:
- "how to get more customers for my food truck"
- "food truck marketing platform"
- "real-time food truck location app"
- "food truck booking for events"
- "advertise my food truck online"

**Desired Outcomes**:
- Customers arrive at truck locations informed of current offerings
- Bookings for private events and corporate catering
- Repeat customers through loyalty mechanisms
- Data on customer preferences and peak demand times

**How MealScout Satisfies**:
- Free operator dashboard with real-time location broadcasting
- Event booking request system with direct coordinator communication
- Deal creation tools for targeted promotions
- Analytics on views, claims, and customer engagement

### Event Coordinators / Planners

**Primary Motivations**:
- Book reliable food vendors for events
- Compare vendor options efficiently
- Ensure vendor availability for specific dates
- Manage vendor logistics centrally

**Common Search Queries**:
- "book food truck for corporate event"
- "food truck catering [city name]"
- "hire taco truck for wedding"
- "food vendor booking platform"
- "food truck event coordination"

**Desired Outcomes**:
- Verified vendor contact information
- Transparent pricing and availability
- Reviews and quality indicators
- Simplified booking workflow

**How MealScout Satisfies**:
- Event interest request system for coordinators
- Verified food truck profiles with operating history
- Direct messaging between coordinators and operators
- Booking confirmation and scheduling tools

### Business Owners Seeking Extra Income

**Primary Motivations**:
- Explore food truck business opportunities
- Understand startup costs and requirements
- Learn from existing operators
- Test market demand before committing capital

**Common Search Queries**:
- "how to start a food truck business"
- "food truck income potential"
- "food truck licensing requirements [city]"
- "best food truck locations [city]"
- "food truck business plan"

**Desired Outcomes**:
- Educational resources on food truck operations
- Market demand insights by location and cuisine
- Low-risk entry path to food service industry
- Connections with established operators

**How MealScout Satisfies**:
- Publicly visible food truck performance metrics
- Location request system showing unmet demand
- Operator community and knowledge sharing
- Platform access for new operators at launch

### General Public / Local Food Searchers

**Primary Motivations**:
- Find food options near current location
- Discover new dining experiences
- Access exclusive deals and discounts
- Make informed dining decisions quickly

**Common Search Queries**:
- "food trucks near me"
- "best tacos in [city name]"
- "[cuisine type] food truck [location]"
- "lunch deals near me today"
- "where is [truck name] right now"

**Desired Outcomes**:
- Real-time location and hours information
- Verified reviews and recommendations
- Notifications for favorite trucks and deals
- Ability to save and share discoveries

**How MealScout Satisfies**:
- GPS-based truck location search with live updates
- Cuisine and proximity-based filtering
- Deal notification system with claim verification
- Video recommendations with visible transcripts

---

## SECTION 3: PAGE TYPES & URL TAXONOMY

### Location-Based Pages

**URL Pattern**: `/food-trucks/[city-slug]`

**Example**: `/food-trucks/new-orleans`

**Primary SEO Intent**: Rank for "[food trucks] [city name]" queries

**Secondary Intents**:
- Local food discovery
- Food truck events in city
- New food truck openings

**Independent Ranking**: Yes. Each city page must rank independently and contain unique content about local food truck scene.

**URL Pattern**: `/food-trucks/[city-slug]/[neighborhood-slug]`

**Example**: `/food-trucks/new-orleans/french-quarter`

**Primary SEO Intent**: Rank for hyperlocal "[food trucks] [neighborhood]" queries

**Secondary Intents**: Neighborhood-specific recommendations and events

**Independent Ranking**: Yes

### Cuisine-Based Pages

**URL Pattern**: `/cuisine/[cuisine-slug]`

**Example**: `/cuisine/mexican`

**Primary SEO Intent**: Rank for "[cuisine type] food trucks" queries

**Secondary Intents**: Cuisine education, popular dishes, vendor discovery

**Independent Ranking**: Yes

**URL Pattern**: `/cuisine/[cuisine-slug]/[city-slug]`

**Example**: `/cuisine/mexican/austin`

**Primary SEO Intent**: Rank for "[cuisine] food trucks in [city]" queries

**Secondary Intents**: Local cuisine variations, vendor comparisons

**Independent Ranking**: Yes

### Food Truck Profile Pages

**URL Pattern**: `/trucks/[truck-slug]`

**Example**: `/trucks/smokin-joes-bbq`

**Primary SEO Intent**: Rank for branded "[truck name]" queries

**Secondary Intents**: Menu discovery, location tracking, reviews

**Independent Ranking**: Yes. Each truck profile must be discoverable as standalone entity.

**URL Pattern**: `/trucks/[truck-slug]/menu`

**Example**: `/trucks/smokin-joes-bbq/menu`

**Primary SEO Intent**: Rank for "[truck name] menu" queries

**Secondary Intents**: Dish-level discovery, pricing information

**Independent Ranking**: Yes

### Event-Focused Pages

**URL Pattern**: `/events/[event-slug]`

**Example**: `/events/french-quarter-fest-2026`

**Primary SEO Intent**: Rank for "[event name] food trucks" queries

**Secondary Intents**: Vendor lineups, event logistics, booking

**Independent Ranking**: Yes

**URL Pattern**: `/events/[city-slug]`

**Example**: `/events/portland`

**Primary SEO Intent**: Rank for "food truck events in [city]" queries

**Secondary Intents**: Upcoming gatherings, festival calendars

**Independent Ranking**: Yes

### Business/Monetization Pages

**URL Pattern**: `/host-signup`

**Primary SEO Intent**: Rank for "start a food truck business" and "how to get customers for food truck"

**Secondary Intents**: Operator onboarding, platform benefits

**Independent Ranking**: Yes

**URL Pattern**: `/event-booking`

**Primary SEO Intent**: Rank for "book food truck for event" queries

**Secondary Intents**: Corporate catering, wedding vendors

**Independent Ranking**: Yes

### Recommendation and Video Pages

**URL Pattern**: `/recommendations/[recommendation-slug]`

**Example**: `/recommendations/best-tacos-french-quarter`

**Primary SEO Intent**: Rank for "[food item] in [location]" queries

**Secondary Intents**: Video discovery, trusted reviews

**Independent Ranking**: Yes. Each video recommendation must be indexable with full transcript.

**URL Pattern**: `/videos/[category-slug]`

**Example**: `/videos/tacos`

**Primary SEO Intent**: Aggregate video content by category

**Secondary Intents**: Discover new creators, trending videos

**Independent Ranking**: Yes

---

## SECTION 4: CUISINE TAXONOMY (CANONICAL)

### Supported Cuisine Types

The following cuisine types are standardized across MealScout for consistency in search, filtering, and LLM understanding:

- American
- BBQ
- Breakfast
- Burgers
- Caribbean
- Chinese
- Coffee
- Desserts
- Filipino
- Fusion
- Greek
- Hawaiian
- Indian
- Italian
- Japanese
- Korean
- Latin American
- Mediterranean
- Mexican
- Middle Eastern
- Pizza
- Sandwiches
- Seafood
- Soul Food
- Southern
- Tacos
- Thai
- Vegan
- Vegetarian
- Vietnamese

### Cuisine Taxonomy Usage

**SEO Application**:
- Cuisine types appear in page titles, headings, and meta descriptions
- URL slugs use lowercase cuisine names with hyphens
- Cuisine pages interlink with location pages for compound queries

**Discovery Application**:
- Users filter food truck search results by one or more cuisine types
- Cuisine tags enable "similar trucks" recommendations
- Deal notifications can be filtered by preferred cuisines

**Filtering Logic**:
- Cuisine taxonomy supports multi-select filtering
- Cuisine + location + availability filters combine using AND logic
- Cuisine tags on food truck profiles support multiple values

**LLM Understanding**:
- Cuisine types are human-recognizable without additional context
- LLMs can map user natural language queries to canonical cuisine types
- Cuisine taxonomy enables accurate question answering about platform content

### Cuisine Assignment Rules

**Food Truck Profiles**:
- Operators select one primary cuisine type (required)
- Operators may select up to three secondary cuisine types (optional)
- Primary cuisine determines default categorization in search

**Video Recommendations**:
- Each video tagged with one or more relevant cuisine types
- Cuisine tags derived from video content, transcript, or manual creator selection
- Videos appear in cuisine-specific feeds and search results

**Deal Listings**:
- Deals inherit cuisine tags from parent food truck profile
- Custom cuisine tags permitted for special menu items

---

## SECTION 5: RECOMMENDATION & VIDEO OPTIMIZATION

### Video as SEO Asset

Every food recommendation video on MealScout must be treated as an independent, indexable page. Videos are not supplementary content but primary discovery mechanisms.

### Required Metadata Per Video

**Mandatory Fields**:
- Video title (60 characters maximum, must include food item and location)
- Full transcript (auto-generated or manual, must be visible on page)
- Cuisine tags (minimum one, maximum five)
- Location tags (city and optional neighborhood)
- Creator attribution (linked to creator profile)
- Publish date (ISO 8601 format)
- Video duration (seconds)

**Optional but Recommended**:
- Food truck association (if reviewing specific vendor)
- Price range mentioned in video
- Dietary restrictions noted (vegan, gluten-free, etc.)
- Related videos (manually curated or algorithmic)

### Transcript Requirements

**Visibility**: Transcripts must be visible as HTML text on the video page, not hidden behind JavaScript or user interaction.

**Format**: Transcripts appear below video player in paragraph format with speaker labels if multiple voices present.

**Indexability**: Transcript text must be crawlable by search engines without rendering JavaScript.

**Accuracy**: Auto-generated transcripts must be reviewed for food-specific terminology accuracy. Incorrect food names, locations, or cuisine types must be corrected manually.

**Why Mandatory**: Transcripts enable:
1. Search engines to understand video content without processing video files
2. LLMs to extract factual claims about food quality and locations
3. Users with hearing impairments to access content
4. Keyword-based discovery for specific dishes or ingredients

### Contextual Text Requirements

**Introduction Block**: Each video page must include 2-3 paragraphs of written context above the video player describing:
- What food item is being reviewed
- Where it can be found (truck name and typical locations)
- Why the creator recommends it
- Any notable qualities (spice level, portion size, price point)

**Creator Bio**: Visible creator profile summary with:
- Creator name and profile photo
- Number of recommendations published
- Cuisine specialties or expertise areas
- Link to full creator profile page

**Related Context**: Below transcript, include:
- Links to food truck profile if applicable
- Links to cuisine category page
- Links to location-based discovery pages
- Embedded map if truck location available

### Standalone Indexable Pages

**URL Structure**: `/recommendations/[slug]` where slug is generated from video title

**Page Title Format**: "[Food Item] at [Location] - [Creator Name] Review | MealScout"

**Meta Description**: First 155 characters of introduction block, or custom description

**Schema Markup**: VideoObject schema with transcript as text property

**Canonical URL**: Each video has exactly one canonical URL, no duplicates

---

## SECTION 6: LLMO (LARGE LANGUAGE MODEL OPTIMIZATION)

### Purpose of LLMO

Large language models (LLMs) such as GPT, Claude, and Gemini increasingly serve as search intermediaries. Users ask conversational questions, and LLMs synthesize answers from indexed content. MealScout content must be written so LLMs can accurately understand, cite, and recommend the platform.

### Entity Clarity Rules

**Explicit Entity Naming**: Always use full entity names on first mention within a page. Never assume LLM has prior context.

**Example**:
- Good: "Smokin' Joe's BBQ is a food truck in Austin, Texas specializing in slow-smoked brisket."
- Bad: "This truck serves great brisket." (ambiguous referent)

**Consistent Entity References**: After establishing full name, use consistent abbreviated forms. Avoid pronouns when possible.

**Example**:
- Good: "Smokin' Joe's BBQ operates Tuesday through Saturday. The food truck posts daily locations on MealScout."
- Bad: "It operates Tuesday through Saturday. They post locations here."

### Redundant Plain-Language Explanations

**Assumption**: LLMs benefit from explicit restatement of facts in multiple forms.

**Implementation**:
- State key facts in headings and repeat in body text
- Use both technical terms and plain-language equivalents
- Provide examples for abstract concepts

**Example**:
- Heading: "Real-Time Location Tracking"
- Body: "MealScout provides real-time location tracking for food trucks. This means customers can see a truck's current GPS coordinates and get directions to its exact location at any moment. Unlike static restaurant listings, food truck locations update automatically as trucks move throughout the day."

### FAQ Blocks

**Requirement**: Every page type must include a Frequently Asked Questions section with at least three question-answer pairs.

**Format**: Use heading tags for questions (H3 or H4) and paragraph tags for answers.

**Content Strategy**: Answer questions using natural language that mirrors how users ask questions.

**Example**:
```
### How do I find food trucks near me?
Open MealScout and allow location permissions. The app displays all active food trucks within your selected radius, sorted by distance. Each truck shows real-time location, current menu, and estimated travel time.

### Are MealScout deals really free?
Yes. MealScout deals are free for customers. Food truck owners create deals to attract customers during slow periods. You claim a deal in the app, show the confirmation code to the truck operator, and receive the discount immediately.

### Can I book a food truck for a private event?
Yes. Use the event booking feature to send availability requests to food trucks. Include your event date, location, expected guest count, and budget. Trucks respond directly with pricing and availability.
```

### Avoiding Ambiguity

**Date References**: Use full dates, not relative terms.
- Good: "January 15, 2026"
- Bad: "next week"

**Location References**: Use complete location information including city and state.
- Good: "French Quarter, New Orleans, Louisiana"
- Bad: "downtown"

**Pronoun Avoidance**: Minimize pronoun use in favor of explicit noun repetition.

**Quantification**: Provide specific numbers when available.
- Good: "Over 200 active food trucks in Portland"
- Bad: "Many food trucks in Portland"

### Target LLM Summary Format

When an LLM summarizes MealScout, the ideal output includes:

**Platform Identity**: "MealScout is a real-time food truck discovery platform serving [cities]."

**Core Functionality**: "Users can track food truck locations via GPS, claim time-limited deals, watch video recommendations, and book trucks for events."

**Differentiation**: "Unlike traditional restaurant apps, MealScout specializes in mobile food vendors with real-time location updates."

**User Types**: "The platform serves food truck operators, event coordinators, and local diners."

**Availability**: "MealScout operates in [list of cities] with plans to expand to additional markets."

---

## SECTION 7: LISAO (INTERNAL INTELLIGENCE OPTIMIZATION)

### Purpose of LISAO

LISAO refers to optimization for LISA (Local Intelligence Services Architecture), the internal AI system powering MealScout's ranking, recommendations, and automation. Unlike SEO and LLMO which target external discovery, LISAO ensures internal data quality for platform operations.

### Entity Types

**Food Trucks**:
- Unique identifier (UUID)
- Operator identity (linked to user account)
- Cuisine classifications (primary and secondary)
- Operating status (active, inactive, seasonal)
- Location history (timestamped GPS coordinates)
- Deal history (created, claimed, expired counts)
- Event participation history
- Customer interaction metrics (views, favorites, claims)

**Cuisines**:
- Canonical cuisine name (from approved taxonomy)
- Alternative names and synonyms
- Related cuisines (for cross-recommendations)
- Representative dishes
- Dietary attribute flags (vegan, gluten-free, halal, etc.)

**Recommendations (Videos)**:
- Video identifier (UUID)
- Creator identity (linked to user account)
- Food truck association (if applicable)
- Cuisine tags (array)
- Location tags (city, neighborhood)
- Transcript text (full, searchable)
- Engagement metrics (views, shares, saves)
- Quality indicators (verified creator, golden fork award)

**Events**:
- Event identifier (UUID)
- Event type (public festival, private booking, corporate catering)
- Location (address and coordinates)
- Date range (start and end timestamps)
- Participating food trucks (array of truck IDs)
- Coordinator identity (if private event)
- Capacity and attendance estimates

**Users**:
- User identifier (UUID)
- User type (customer, food truck operator, event coordinator, admin)
- Location preferences (saved addresses, favorite cities)
- Cuisine preferences (explicit tags or inferred from behavior)
- Interaction history (deals claimed, trucks favorited, videos watched)
- Trust score (for review quality and golden fork eligibility)

### Claim-Style Facts

LISA stores discrete factual claims about entities for reasoning and ranking:

**Food Truck Claims**:
- "Truck X operates in City Y"
- "Truck X serves Cuisine Z as primary category"
- "Truck X has claimed N deals in past 30 days"
- "Truck X has average response time of M minutes to event requests"
- "Truck X has received P golden plate awards"

**Location Claims**:
- "Neighborhood X in City Y has N active food trucks"
- "City Y has unmet demand for Cuisine Z based on M location requests"
- "Location X,Y coordinates have high foot traffic on weekday lunchtimes"

**Cuisine Claims**:
- "Cuisine X is most popular in City Y based on search volume"
- "Cuisine X has N active food trucks platform-wide"
- "Users who prefer Cuisine X also prefer Cuisine Y with P probability"

**Recommendation Claims**:
- "Video X mentions Food Truck Y positively"
- "Video X transcript contains keyword Z"
- "Creator X has expertise in Cuisine Y based on video history"
- "Video X has engagement rate above platform median"

### How LISA Uses Claims for Ranking

**Food Truck Discovery Ranking**:
1. Base score from proximity to user location (inverse distance)
2. Multiplier for cuisine match with user preferences
3. Boost for recent activity (deals posted, location updates)
4. Boost for quality signals (golden plates, high claim-to-view ratio)
5. Penalty for low responsiveness to customer interactions

**Deal Ranking**:
1. Base score from deal value (percentage discount or dollar amount)
2. Boost for time urgency (deals expiring soon rank higher)
3. Boost for cuisine match with user preferences
4. Boost for trucks user has favorited
5. Penalty for trucks with history of expired unclaimed deals (suggests poor targeting)

**Video Recommendation Ranking**:
1. Base score from engagement rate (views, saves, shares)
2. Boost for cuisine match with user watch history
3. Boost for location relevance (videos about nearby trucks)
4. Boost for creator trust score (verified, golden fork holder)
5. Recency factor (newer videos slightly boosted)

### Automation Using Claims

**Deal Suggestion Automation**:
- LISA identifies trucks with low recent activity
- Generates suggested deal templates based on cuisine and past successful deals
- Notifies operators with actionable recommendations

**Location Request Matching**:
- User submits location request for Cuisine X in Area Y
- LISA identifies trucks serving Cuisine X not currently operating in Area Y
- Sends notification to matching truck operators with demand signal

**Event Coordinator Recommendations**:
- Coordinator searches for trucks for Event X in City Y
- LISA ranks trucks by availability, cuisine diversity, and past event performance
- Surfaces top matches with booking prompt

**Content Gap Identification**:
- LISA detects City X has N food trucks but only M video recommendations
- Flags content gap to recommendation creator community
- Incentivizes video creation for underrepresented areas

---

## SECTION 8: SCHEMA & STRUCTURED DATA STRATEGY

### Purpose of Structured Data

Structured data (schema.org markup) provides machine-readable metadata about page content. Search engines use schema to generate rich snippets and understand entity relationships. However, schema alone is insufficient for ranking and must complement visible HTML content.

### Required Schema Types by Page

**Food Truck Profile Pages**: `LocalBusiness` or `FoodEstablishment` schema

**Required Properties**:
- name (truck name)
- address (operating city, not specific address due to mobility)
- telephone (contact number)
- servesCuisine (array of cuisine types)
- openingHoursSpecification (typical operating days and hours)
- geo (current coordinates if broadcasting location)
- image (truck photo)
- priceRange (relative price indicator)

**Video Recommendation Pages**: `VideoObject` schema

**Required Properties**:
- name (video title)
- description (video description or first paragraph of context)
- thumbnailUrl (video thumbnail image)
- uploadDate (ISO 8601 date)
- duration (ISO 8601 duration format)
- contentUrl (video file URL)
- transcript (full text of video transcript)

**Event Pages**: `Event` schema

**Required Properties**:
- name (event name)
- startDate (ISO 8601 datetime)
- endDate (ISO 8601 datetime)
- location (address and coordinates)
- description (event details including participating food trucks)
- organizer (event coordinator or MealScout)
- eventStatus (scheduled, cancelled, rescheduled)

**Deal/Offer Pages**: `Offer` schema (embedded within LocalBusiness)

**Required Properties**:
- name (deal title)
- description (deal terms)
- priceSpecification (discount amount or percentage)
- availability (in stock, limited availability)
- validFrom (ISO 8601 datetime)
- validThrough (ISO 8601 datetime or null if ongoing)
- seller (food truck entity)

**Location Pages**: `ItemList` schema (listing food trucks in location)

**Required Properties**:
- numberOfItems (count of food trucks)
- itemListElement (array of trucks with position and item properties)

### Why Schema Is Necessary but Insufficient

**Necessary Because**:
- Search engines prioritize pages with accurate structured data for rich results
- Schema enables appearance in specialized search features (local pack, event listings)
- Structured data improves understanding of entity relationships

**Insufficient Because**:
- Schema without corresponding visible content appears as manipulation to search engines
- Users cannot read schema markup; visible text must contain equivalent information
- Schema does not substitute for comprehensive, well-written HTML content
- LLMs primarily process visible text, not JSON-LD schema

**Correct Strategy**:
- Emit schema that accurately reflects visible page content
- Never include schema properties without corresponding HTML representation
- Use schema to reinforce, not replace, on-page content

### Schema Emission Rules

**Single Source of Truth**: Schema properties must be derived from same database fields that populate visible HTML

**No Schema-Only Content**: If a fact appears in schema, it must also appear in visible text

**Validation**: Run schema validation tools (Google Rich Results Test) on representative pages from each page type

**Updates**: When visible content updates, schema updates simultaneously

---

## SECTION 9: CONTENT RULES & FAIL-SAFES

### No Orphan Pages

**Rule**: Every page on MealScout must be reachable through at least two distinct navigation paths from the homepage.

**Rationale**: Orphan pages harm crawlability and user experience.

**Enforcement**:
- Automated crawl audit weekly to detect orphan pages
- Alert system notifies engineering team of any orphaned URLs
- Manual review required before publishing new page types

**Paths Required**:
- Hierarchical navigation (homepage → category → subcategory → page)
- Contextual linking (related pages, recommendations, cross-references)

### No JavaScript-Only SEO Content

**Rule**: All content intended for SEO discovery must render in HTML without JavaScript execution.

**Rationale**: Search engine crawlers may not execute JavaScript reliably. LLMs primarily process HTML.

**Enforcement**:
- Server-side rendering or static site generation for all public pages
- Automated testing with JavaScript disabled to verify content visibility
- No critical content (headings, body text, links) loaded via AJAX after initial page load

**Exceptions**: Interactive features (maps, filters, real-time updates) may use JavaScript after initial HTML content renders.

### No Videos Without Transcripts

**Rule**: Video recommendation pages must include full visible transcripts before publication.

**Rationale**: Videos are not indexable without text. Transcripts enable search discovery and accessibility.

**Enforcement**:
- Publishing workflow blocks video publication until transcript field populated
- Auto-generated transcripts flagged for manual review
- Transcript visibility tested on representative devices (mobile, desktop, screen readers)

**Transcript Minimum Length**: 50 words for videos under 1 minute, 100 words for videos 1-3 minutes, 200 words for videos over 3 minutes.

### No Pages Without Explicit Intent

**Rule**: Every published page must have documented primary search intent and success metrics.

**Rationale**: Pages without defined purpose dilute crawl budget and confuse search engines.

**Enforcement**:
- Page type documentation must include intent statement
- New page types require approval with intent justification
- Quarterly audit of low-performing pages for removal or consolidation

**Intent Documentation Format**:
- Primary keyword target (what search query should this page rank for)
- User goal (what does user want to accomplish on this page)
- Success metric (how is page performance measured)

### No Auto-Generated Thin Content

**Rule**: Programmatically generated pages must contain unique, substantive content beyond template boilerplate.

**Rationale**: Thin content pages trigger search engine quality filters.

**Enforcement**:
- Minimum 300 words unique content per location or cuisine page
- Template text must not exceed 40% of total page word count
- Automated quality check before publication of template-driven pages

**Unique Content Sources**:
- Local facts about food truck scene in city
- Cuisine history or regional variations
- User-generated reviews and recommendations
- Data-driven insights (number of trucks, popular dishes, peak times)

### No Duplicate Content Across Domains

**Rule**: MealScout content must not duplicate TradeScout content or external sources.

**Rationale**: Duplicate content causes canonical confusion and ranking dilution.

**Enforcement**:
- Canonical tags point to single authoritative version of any shared content
- Cross-platform content clearly attributed and linked, not copied
- Plagiarism detection tools run on all editorial content before publication

**Shared Content Strategy**: If content appears on both MealScout and TradeScout, one domain is designated canonical and the other uses rel=canonical tag or 301 redirect.

---

## SECTION 10: FUTURE EXPANSION NOTES

### New Cities

**Scalability Requirements**:
- Location page templates must support city addition without code changes
- Cuisine availability by city stored in database, not hardcoded
- Local content sourcing strategy (user submissions, partnerships, manual curation) documented per market

**SEO Consideration**: Each new city receives dedicated page with local content before food truck listings go live. Prevents thin content issue during market launch.

### New Cuisines

**Addition Process**:
- New cuisine types added to canonical taxonomy only after validation of search volume
- Cuisine synonyms and alternative names mapped to canonical types
- Cross-references to existing cuisines updated (related cuisines, fusion categories)

**Content Strategy**: New cuisine category pages require minimum of three food trucks or ten video recommendations before publication.

### New Monetization Paths

**Potential Paths**:
- Premium operator subscriptions for enhanced visibility
- Event booking transaction fees
- Sponsored deal placements
- Affiliate relationships with food suppliers

**SEO Impact Mitigation**: Any paid placement must be clearly labeled (not deceptive) and must not alter organic ranking algorithms. Sponsored content receives noindex tag if not editorially valuable.

### New AI-Driven Features

**Potential Features**:
- Personalized deal recommendations via email or push notifications
- Automated video highlight generation from user submissions
- Predictive demand modeling to suggest truck locations
- Natural language query interface for food truck search

**Data Requirements**: AI features must consume existing structured data (entity claims, user preferences, interaction history). No creation of parallel data structures that diverge from canonical sources.

**User Transparency**: AI-generated content (summaries, recommendations, predictions) must be labeled as such. Users retain ability to view non-AI-filtered results.

---

## CANONICAL DECLARATION

This document is the authoritative reference for all search engine optimization, large language model optimization, and internal intelligence architecture decisions for MealScout.

In cases of conflict between this document and implementation details, this document takes precedence. Implementation must align with principles documented here.

Engineers, AI agents, and platform architects must consult this document before making changes to:
- URL structures
- Page templates
- Content generation workflows
- Schema markup
- Entity definitions
- Ranking algorithms

Changes to SEO, LLMO, or LISAO strategy require update to this document with version tracking and approval from platform leadership.

**Document Authority**: Canonical

**Maintained By**: MealScout Engineering Team

**Review Cadence**: Quarterly or as needed for major platform changes
