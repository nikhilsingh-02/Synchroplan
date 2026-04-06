import React, { useState } from "react";
import { useAIInsights } from "../../hooks/useAIInsights";
import { useNearbyPlaces, type Recommendation } from "../../hooks/useNearbyPlaces";
import { PlaceDetailsModal } from "../../components/places/PlaceDetailsModal";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

import {
  Lightbulb,
  TrendingUp,
  MapPin,
  Navigation,
  Star,
  Filter,
  Utensils,
  Hotel,
  Wrench,
  RefreshCw,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Hospital,
  ShoppingCart,
  Activity,
  HeartPulse,
  Monitor,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";

export const Recommendations: React.FC = () => {
  const { insights: aiInsights, isLoading: isLoadingInsights } = useAIInsights();
  const { 
    places, 
    isLoading, 
    isLocating, 
    error, 
    refetch, 
    targetLocationName, 
    searchRadiusKm 
  } = useNearbyPlaces();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);

  const filteredRecommendations = isLoading 
    ? [] 
    : places.filter((rec) => {
      const matchesSearch = rec.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (selectedType === "local") {
        return (rec.isLocalFavorite || rec.relevanceScore > 0.8) && matchesSearch;
      }
      
      const matchesType = selectedType === "all" || rec.type.toLowerCase().includes(selectedType.toLowerCase());
      return matchesSearch && matchesType;
    });

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("canteen") || t.includes("food_court")) return <Utensils className="h-4 w-4 text-orange-500" />;
    if (t.includes("restaurant") || t.includes("food") || t.includes("cafe")) return <Utensils className="h-4 w-4 text-indigo-500" />;
    if (t.includes("hotel") || t.includes("lodging"))    return <Hotel className="h-4 w-4 text-blue-500" />;
    if (t.includes("university") || t.includes("college") || t.includes("school")) return <Monitor className="h-4 w-4 text-purple-500" />;
    if (t.includes("hospital") || t.includes("pharmacy")) return <HeartPulse className="h-4 w-4 text-red-400" />;
    return <MapPin className="h-4 w-4 text-gray-400" />;
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-700">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">
              Smart Recommendations
            </h1>
            <p className="text-lg text-gray-400 mt-2 font-bold tracking-tight">
              Prioritizing Local Vibe: Food, Social, & Campus Hubs.
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => refetch()}
            disabled={isLoading || isLocating}
            className="rounded-2xl shadow-sm border-gray-100 h-12 px-8 font-black hover:bg-gray-50 active:scale-95 transition-all"
          >
            {isLoading || isLocating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh Area
          </Button>
        </div>

        {/* AI Insight (Focused on Local Area) */}
        {aiInsights.length > 0 && (
           <section className="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-[3rem] p-10 text-white shadow-3xl shadow-indigo-200 overflow-hidden relative group">
              <Zap className="absolute -top-10 -right-10 h-40 w-40 text-white/5 rotate-12 transition-transform group-hover:scale-110" />
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Local Insights</h2>
                  <p className="text-indigo-200 font-bold text-sm tracking-widest uppercase">AI-Powered Predictions</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {aiInsights.slice(0, 2).map((insight) => (
                  <div key={insight.id} className="bg-white/10 backdrop-blur-3xl rounded-[2rem] p-8 border border-white/10 hover:bg-white/20 transition-all group/card">
                    <h3 className="text-xl font-black mb-3">{insight.title}</h3>
                    <p className="text-base text-indigo-100/80 font-medium mb-6 line-clamp-2 leading-relaxed">{insight.description}</p>
                    <div className="flex items-center justify-between">
                       <Badge className="bg-white text-indigo-900 font-black px-6 py-2 rounded-2xl shadow-xl shadow-indigo-950/20">{insight.recommendedAction}</Badge>
                       <ChevronRight className="h-6 w-6 text-white/40 group-hover/card:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
           </section>
        )}

        {/* Discovery Feed */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                   <MapPin className="h-6 w-6 fill-indigo-600/20" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">
                    {targetLocationName}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black px-3 py-1 text-[10px] uppercase tracking-widest rounded-lg">Real-Life Active</Badge>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-[0.15em]">• Optimized for Proximity</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <Tabs value={selectedType} onValueChange={setSelectedType} className="shrink-0">
                <TabsList className="bg-gray-100 p-1.5 rounded-2xl h-14">
                  <TabsTrigger value="local" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 shadow-none">Local Vibe</TabsTrigger>
                  <TabsTrigger value="all" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white shadow-none">All Area</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative group flex-1 md:w-80">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  className="pl-13 bg-white border-gray-100 rounded-[1.25rem] h-14 shadow-sm focus:ring-0 focus:border-indigo-400 transition-all font-bold text-gray-800"
                  placeholder="Find local spots..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Result States */}
          {error && (
            <div className="py-24 text-center bg-red-50/50 rounded-[4rem] border border-red-100/50">
               <AlertCircle className="h-20 w-20 mx-auto mb-8 text-red-400 animate-bounce" />
               <h3 className="text-3xl font-black text-red-900">Vibe Check Failed</h3>
               <p className="text-red-700/60 mt-2 font-bold text-lg">{error}</p>
               <Button onClick={() => refetch()} className="mt-10 bg-red-600 hover:bg-black rounded-3xl px-12 h-16 font-black text-white shadow-2xl shadow-red-200 transition-all active:scale-95">Try Discovery Again</Button>
            </div>
          )}

          {(isLoading || isLocating) ? (
            <div className="py-40 flex flex-col items-center">
              <div className="relative">
                 <Loader2 className="h-20 w-20 text-indigo-600 animate-spin" />
                 <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-indigo-600/30 animate-pulse" />
              </div>
              <p className="mt-8 text-2xl font-black text-gray-900 tracking-tight">Prioritizing the Vibe...</p>
              <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Matching Google Data & OSM Essentials</p>
            </div>
          ) : !error && filteredRecommendations.length === 0 ? (
            <div className="py-32 text-center bg-gray-50/50 rounded-[4rem] border border-dashed border-gray-200 group">
               <Search className="h-20 w-20 mx-auto mb-8 text-gray-100 group-hover:scale-110 group-hover:text-amber-200 transition-all duration-500" />
               <h3 className="text-3xl font-black text-gray-300">No local Area spots found</h3>
               <p className="text-gray-400 font-bold text-lg">Try switching to "All Area" to see more general results.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredRecommendations.map((rec) => (
                <Card key={rec.id} className={`group relative overflow-hidden transition-all duration-500 rounded-[3rem] border-2 bg-white ${rec.isLocalFavorite ? "border-indigo-100 shadow-2xl shadow-indigo-100/50 scale-[1.02]" : "border-gray-50 hover:border-indigo-100 shadow-sm hover:shadow-xl"}`}>
                  {rec.isLocalFavorite && (
                    <div className="absolute top-8 right-8 z-10">
                       <Badge className="bg-indigo-600 text-white font-black px-4 py-1.5 rounded-full shadow-lg border-0 animate-in zoom-in duration-500">
                         <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                         Local Favorite
                       </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="p-12 pb-6">
                    <div className="flex items-center gap-3 mb-4">
                       <Badge variant="outline" className={`text-[10px] font-black tracking-widest border-2 uppercase px-3 py-1 rounded-xl ${rec.source === 'google' ? 'text-blue-600 border-blue-50 bg-blue-50/30' : 'text-orange-600 border-orange-50 bg-orange-50/30'}`}>
                         {rec.source}
                       </Badge>
                       <span className="text-[10px] font-black tracking-widest text-gray-300 uppercase">{rec.distance.toFixed(1)} km away</span>
                    </div>
                    <CardTitle className="text-3xl font-black text-gray-900 group-hover:text-indigo-600 transition-all leading-tight line-clamp-2 tracking-tight">
                      {rec.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-12 pt-0 space-y-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-base text-gray-500 font-bold bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                          {getTypeIcon(rec.type)}
                          <span className="truncate">{rec.location}</span>
                        </div>
                        <div className="flex items-center gap-6 px-1">
                          <div className="flex items-center gap-2">
                             <div className="flex gap-0.5">
                               {Array.from({length: 5}).map((_, i) => (
                                 <Star key={i} className={`h-4 w-4 ${i < Math.floor(rec.rating) ? "text-amber-400 fill-amber-400" : "text-gray-100 fill-gray-100"}`} />
                               ))}
                             </div>
                             <span className="text-base font-black text-gray-900">{rec.rating.toFixed(1)}</span>
                          </div>
                          {rec.user_ratings_total && (
                             <span className="text-sm text-gray-400 font-bold">({rec.user_ratings_total} Reviews)</span>
                          )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        className="flex-1 h-18 rounded-[1.5rem] bg-indigo-600 text-white font-black shadow-2xl shadow-indigo-200 hover:bg-black transition-all active:scale-95 text-lg"
                        onClick={() => {
                          const query = encodeURIComponent(`${rec.name} ${rec.location}`);
                          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                        }}
                      >
                        <Navigation className="h-6 w-6 mr-3 text-white/50" />
                        Go There
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
      
      <PlaceDetailsModal
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
      />
    </>
  );
};