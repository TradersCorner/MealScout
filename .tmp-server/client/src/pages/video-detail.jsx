import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useEffect } from "react";
import Navigation from "@/components/navigation";
import { BackHeader } from "@/components/back-header";
import { VideoTranscript } from "@/components/video-transcript";
import { MinimalFAQ } from "@/components/seo-faq";
import { SEOHead } from "@/components/seo-head";
import { generateVideoSchema } from "@/lib/schema-helpers";
import { Video, MapPin, User, Calendar, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ShareButton from "@/components/share-button";
export default function VideoDetailPage() {
    var videoId = useParams().id;
    var _a = useQuery({
        queryKey: ["/api/stories", videoId],
        enabled: !!videoId,
    }), video = _a.data, isLoading = _a.isLoading;
    var restaurant = useQuery({
        queryKey: ["/api/restaurants", video === null || video === void 0 ? void 0 : video.restaurantId],
        enabled: !!(video === null || video === void 0 ? void 0 : video.restaurantId),
    }).data;
    // Track video view
    useEffect(function () {
        if (videoId && video && !isLoading) {
            fetch("/api/stories/".concat(videoId, "/view"), {
                method: "POST",
                credentials: "include",
            }).catch(function () {
                // Silent fail - view tracking shouldn't interrupt UX
            });
        }
    }, [videoId, video, isLoading]);
    if (isLoading) {
        return (<div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
        <div className="animate-pulse p-6 space-y-4">
          <div className="w-full h-96 bg-muted rounded-2xl"></div>
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>);
    }
    if (!video) {
        return (<div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-4">Video not found</h2>
          <Link href="/video">
            <Button>Back to Videos</Button>
          </Link>
        </div>
        <Navigation />
      </div>);
    }
    var videoData = video;
    var restaurantData = restaurant;
    var videoTitle = videoData.title || "Food Recommendation";
    var videoDescription = videoData.description ||
        "Watch ".concat(videoTitle, " - a local food recommendation on MealScout");
    var creatorName = videoData.creatorName ||
        videoData.username ||
        (videoData.user && (videoData.user.firstName || videoData.user.lastName)
            ? "".concat(videoData.user.firstName || "", " ").concat(videoData.user.lastName || "").trim()
            : "MealScout Creator");
    var restaurantName = (restaurantData === null || restaurantData === void 0 ? void 0 : restaurantData.name) || "";
    var location = (restaurantData === null || restaurantData === void 0 ? void 0 : restaurantData.address) || "";
    // Generate VideoObject schema
    var videoSchema = generateVideoSchema({
        id: videoData.id,
        title: videoTitle,
        description: videoDescription,
        thumbnailUrl: videoData.thumbnailUrl,
        videoUrl: videoData.videoUrl,
        uploadDate: videoData.createdAt,
        duration: videoData.duration,
        transcript: videoData.transcript,
        creatorName: creatorName,
    });
    // FAQ items specific to this video
    var faqItems = [
        {
            question: "What is this video about?",
            answer: "This video is a ".concat(videoData.duration, "-second food recommendation featuring ").concat(restaurantName || "local food", ". ").concat(videoDescription),
        },
        {
            question: "Where can I find this food?",
            answer: location
                ? "You can find this at ".concat(restaurantName, " located at ").concat(location, ". Check MealScout for current deals and hours.")
                : "This is a personal food recommendation. Check the video for details about where to find this dish.",
        },
        {
            question: "How do I watch more food videos?",
            answer: "Browse the MealScout Video tab to discover food recommendations from local users. You can filter by cuisine type, location, and trending videos.",
        },
    ];
    return (<div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      <SEOHead title={"".concat(videoTitle, " ").concat(restaurantName ? "at ".concat(restaurantName) : "", " - Video | MealScout")} description={videoDescription} keywords={"".concat(videoTitle, ", ").concat(videoData.cuisine || "food", " video, ").concat(restaurantName || "food recommendation", ", local food")} canonicalUrl={"https://mealscout.us/video/".concat(videoId)} schemaData={videoSchema}/>

      <BackHeader title="Video" fallbackHref="/video" icon={Video}/>

      {/* Video Player */}
      <div className="relative w-full bg-black aspect-[9/16]">
        {videoData.videoUrl ? (<video src={videoData.videoUrl} poster={videoData.thumbnailUrl} controls className="w-full h-full object-contain" playsInline/>) : (<div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-center">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-50"/>
              <p className="text-sm">Video not available</p>
            </div>
          </div>)}
      </div>

      {/* Video Info */}
      <div className="px-6 py-6 space-y-6">
        {/* Title and Description */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {videoTitle}
          </h1>
          {videoData.description && (<p className="text-gray-700 leading-relaxed">
              {videoData.description}
            </p>)}
          <div className="mt-3">
            <ShareButton url={"/video/".concat(videoId)} title={videoTitle} description={videoDescription} size="sm" variant="outline" className="w-full justify-center"/>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          {videoData.cuisine && (<Badge variant="secondary">{videoData.cuisine}</Badge>)}
          {videoData.hashtags &&
            videoData.hashtags.length > 0 &&
            videoData.hashtags.map(function (tag) { return (<Badge key={tag} variant="outline">
                {tag}
              </Badge>); })}
        </div>

        {/* Creator & Restaurant */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4"/>
            <span>{creatorName}</span>
          </div>
          {restaurantName && (<div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4"/>
              <Link href={"/restaurants/".concat(videoData.restaurantId)} className="hover:text-primary">
                {restaurantName}
              </Link>
            </div>)}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4"/>
            <span>{new Date(videoData.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Engagement */}
        <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
          <Button variant="outline" size="sm">
            <Heart className="w-4 h-4 mr-2"/>
            {videoData.likeCount || 0}
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2"/>
            Share
          </Button>
        </div>

        {/* Transcript - Hidden by default, crawlable */}
        {videoData.transcript && (<VideoTranscript transcript={videoData.transcript} language={videoData.transcriptLanguage || "en"} className="mt-6"/>)}

        {/* Restaurant CTA */}
        {restaurantData && (<div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
            <h3 className="font-semibold mb-2">{restaurantName}</h3>
            <p className="text-sm text-gray-600 mb-3">{location}</p>
            <Link href={"/restaurants/".concat(videoData.restaurantId)}>
              <Button className="w-full">View Restaurant & Deals</Button>
            </Link>
          </div>)}

        {/* FAQ Section - SEO optimized, minimal UI */}
        <div className="pt-8 border-t border-gray-200">
          <MinimalFAQ items={faqItems} title="About This Video"/>
        </div>
      </div>

      <Navigation />
    </div>);
}
