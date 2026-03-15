import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAIInsights } from "../../hooks/useAIInsights";


import {

  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  IndianRupee,
} from "lucide-react";

export const Recommendations: React.FC = () => {
  const { recommendations } = useApp();
  const { insights: aiInsights, isLoading: isLoadingInsights } = useAIInsights();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  /* ------------------------------------------------
     Filter recommendations
  ------------------------------------------------ */


  const filteredRecommendations = recommendations.filter((rec) => {
    const matchesSearch =
      rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedType === "all" || rec.type === selectedType;

    return matchesSearch && matchesType;
  });

  /* ------------------------------------------------
     Icon selection
  ------------------------------------------------ */

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "restaurant":
        return <Utensils className="h-4 w-4" />;
      case "hotel":
        return <Hotel className="h-4 w-4" />;
      case "service":
        return <Wrench className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return "text-green-600";
    if (score >= 0.7) return "text-blue-600";
    return "text-gray-600";
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "high") return "bg-red-600 border-red-200";
    if (severity === "medium") return "bg-yellow-500 border-yellow-200";
    return "bg-blue-600 border-blue-200";
  };

  const getSeverityBgColor = (severity: string) => {
    if (severity === "high") return "bg-red-50 border-red-200";
    if (severity === "medium") return "bg-yellow-50 border-yellow-200";
    return "bg-blue-50 border-blue-200";
  };

  const getSeverityTextColor = (severity: string) => {
    if (severity === "high") return "text-red-900";
    if (severity === "medium") return "text-yellow-900";
    return "text-blue-900";
  };

  const getSeveritySubTextColor = (severity: string) => {
    if (severity === "high") return "text-red-700";
    if (severity === "medium") return "text-yellow-700";
    return "text-blue-700";
  };

  return (
    <div className="space-y-6">

      {/* Page header */}

      <div>
        <h1 className="text-3xl font-bold">
          Smart Recommendations
        </h1>

        <p className="text-gray-600">
          AI‑powered suggestions based on your schedule,
          travel routes and spending
        </p>
      </div>

      {/* Search + Filters */}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">

            <Input
              placeholder="Search recommendations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <Tabs
              value={selectedType}
              onValueChange={setSelectedType}
              className="w-full md:w-auto"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="restaurant">Food</TabsTrigger>
                <TabsTrigger value="hotel">Hotels</TabsTrigger>
                <TabsTrigger value="service">Services</TabsTrigger>
              </TabsList>
            </Tabs>

          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}

      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          AI‑Powered Insights
        </h2>

        {isLoadingInsights ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Generating AI insights...
            </CardContent>
          </Card>
        ) : aiInsights.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No AI insights yet. Add schedules, routes, or expenses.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {aiInsights.map((insight, idx) => (
              <Card key={insight.id || idx} className={`border ${getSeverityBgColor(insight.severity)}`}>

                <CardContent className="pt-6">

                  <div className="flex items-start gap-3">

                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getSeverityColor(insight.severity)} shadow-sm`}>
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>

                    <div>

                      <h3 className={`font-semibold ${getSeverityTextColor(insight.severity)} leading-tight mb-1`}>
                        {insight.title}
                      </h3>

                      <p className={`text-sm ${getSeveritySubTextColor(insight.severity)} mb-3`}>
                        {insight.description}
                      </p>

                      <Badge className={`${getSeverityColor(insight.severity)} text-white`}>
                        {insight.impact}
                      </Badge>
                      
                      <div className="mt-4 pt-3 border-t border-black/10">
                        <p className={`text-xs font-medium ${getSeverityTextColor(insight.severity)}`}>
                          <span className="opacity-75">Recommendation:</span><br/>
                          {insight.recommendedAction}
                        </p>

                        {insight.optimizationDetails && (
                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs bg-white/60 p-3 rounded-md border border-black/5">
                            <div>
                              <p className="font-semibold text-gray-700 mb-1">
                                Current ({Math.round(insight.optimizationDetails.originalTravelTime)}m travel)
                              </p>
                              <ol className="list-decimal pl-4 space-y-1 text-gray-600">
                                {insight.optimizationDetails.originalOrder?.map((ev, i) => (
                                  <li key={`orig-${ev.id}-${i}`} className="truncate" title={ev.title}>{ev.title}</li>
                                ))}
                              </ol>
                            </div>
                            <div>
                              <p className="font-semibold text-green-700 mb-1">
                                Optimized ({Math.round(insight.optimizationDetails.optimizedTravelTime)}m travel)
                              </p>
                              <ol className="list-decimal pl-4 space-y-1 text-green-700">
                                {insight.optimizationDetails.optimizedOrder.map((ev, i) => (
                                  <li key={`opt-${ev.id}-${i}`} className="truncate" title={ev.title}>{ev.title}</li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>

                </CardContent>

              </Card>
            ))}

          </div>
        )}
      </div>

      {/* Location Recommendations */}

      <div>

        <h2 className="text-xl font-semibold mb-4">
          Location‑Based Recommendations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {filteredRecommendations.map((rec) => (

            <Card key={rec.id} className="hover:shadow-lg transition-shadow">

              <CardHeader className="pb-3">

                <div className="flex items-center gap-2">

                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    {getTypeIcon(rec.type)}
                  </div>

                  <div>

                    <CardTitle className="text-base">
                      {rec.name}
                    </CardTitle>

                    <Badge
                      variant="outline"
                      className="mt-1 capitalize text-xs"
                    >
                      {rec.type}
                    </Badge>

                  </div>

                </div>

              </CardHeader>

              <CardContent className="space-y-3">

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {rec.location}
                </div>

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {rec.rating}
                  </div>

                  <span className="text-sm text-gray-600">
                    {rec.distance} km away
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    {rec.priceRange}
                  </div>

                  <span
                    className={`font-semibold ${getRelevanceColor(
                      rec.relevanceScore
                    )}`}
                  >
                    {(rec.relevanceScore * 100).toFixed(0)}%
                  </span>

                </div>

                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{
                      width: `${rec.relevanceScore * 100}%`,
                    }}
                  />

                </div>

                <div className="flex gap-2 pt-2">

                  <Button size="sm" className="flex-1">
                    <Navigation className="h-3 w-3 mr-1" />
                    Navigate
                  </Button>

                  <Button size="sm" variant="outline">
                    Details
                  </Button>

                </div>

              </CardContent>
            </Card>
          ))}

        </div>

        {filteredRecommendations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Filter className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">
                No recommendations found
              </p>
            </CardContent>
          </Card>
        )}

      </div>

    </div>
  );
};