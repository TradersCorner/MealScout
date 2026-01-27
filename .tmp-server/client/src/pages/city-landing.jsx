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
import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/seo-head";
import { Link } from "wouter";
function fetchCity(slug) {
    var _this = this;
    return fetch("/api/cities/".concat(encodeURIComponent(slug))).then(function (r) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!r.ok)
                throw new Error("City not found");
            return [2 /*return*/, r.json()];
        });
    }); });
}
export default function CityLanding() {
    var params = useParams();
    var slug = params.citySlug;
    var _a = useQuery({
        queryKey: ["city", slug],
        queryFn: function () { return fetchCity(slug); },
        staleTime: 60000,
    }), data = _a.data, isLoading = _a.isLoading, error = _a.error, refetch = _a.refetch;
    useEffect(function () {
        // Refetch on slug change
        refetch();
    }, [slug]);
    if (isLoading) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
      </div>);
    }
    if (error || !data) {
        return (<div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">City Not Found</h1>
        <p className="text-slate-600">This city may not have any activity yet.</p>
      </div>);
    }
    var title = "".concat(data.city.name).concat(data.city.state ? ", " + data.city.state : "", " Food Trucks & Restaurants");
    var description = "Discover food trucks, restaurants, and upcoming events in ".concat(data.city.name, ". Real-time updates, top cuisines, and video stories.");
    var canonical = "/food-trucks/".concat(data.city.slug);
    return (<div>
      <SEOHead title={title} description={description} canonicalUrl={canonical}/>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900">
            Food Trucks in {data.city.name}
          </h1>
          <p className="text-slate-600 mt-2">Updated {new Date(data.updatedAt).toLocaleString()}</p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Featured Trucks</h2>
          {data.trucks.length === 0 ? (<p className="text-slate-600">No trucks yet. Be the first to join.</p>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.trucks.slice(0, 12).map(function (t) { return (<Link key={t.id} href={"/restaurant/".concat(t.id)}>
                  <a className="block border rounded-lg p-4 hover:shadow transition">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-slate-600">{t.cuisineType || "Cuisine"}</div>
                  </a>
                </Link>); })}
            </div>)}
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Restaurants</h2>
          {data.restaurants.length === 0 ? (<p className="text-slate-600">No restaurants yet.</p>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.restaurants.slice(0, 12).map(function (r) { return (<Link key={r.id} href={"/restaurant/".concat(r.id)}>
                  <a className="block border rounded-lg p-4 hover:shadow transition">
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-sm text-slate-600">{r.cuisineType || "Cuisine"}</div>
                  </a>
                </Link>); })}
            </div>)}
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Upcoming Events</h2>
          {data.events.length === 0 ? (<p className="text-slate-600">No upcoming events yet.</p>) : (<div className="space-y-3">
              {data.events.slice(0, 10).map(function (e) { return (<div key={e.id} className="border rounded-lg p-4">
                  <div className="font-semibold">{e.name || "Food Truck Event"}</div>
                  <div className="text-sm text-slate-600">
                    {new Date(e.date).toLocaleDateString()} — {e.startTime} to {e.endTime}
                  </div>
                </div>); })}
            </div>)}
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Top Cuisines</h2>
          {data.cuisines.length === 0 ? (<p className="text-slate-600">No cuisines yet.</p>) : (<div className="flex flex-wrap gap-2">
              {data.cuisines.map(function (c) { return (<span key={c.name} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm">
                  {c.name} ({c.count})
                </span>); })}
            </div>)}
        </section>

        {data.stories.length > 0 && (<section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Video Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.stories.map(function (s) { return (<a key={s.id} href={s.videoUrl} target="_blank" rel="noreferrer" className="block border rounded-lg p-4 hover:shadow transition">
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm text-slate-600">{s.cuisine || ""}</div>
                </a>); })}
            </div>
          </section>)}
      </div>
    </div>);
}
