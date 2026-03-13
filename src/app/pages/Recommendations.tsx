import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Lightbulb,
  Star,
  MapPin,
  IndianRupee,
  Navigation,
  Hotel,
  Utensils,
  Wrench,
  TrendingUp,
  Filter,
} from 'lucide-react';

export const Recommendations: React.FC = () => {
  const { recommendations } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesSearch = rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rec.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || rec.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return <Utensils className="h-4 w-4" />;
      case 'hotel': return <Hotel className="h-4 w-4" />;
      case 'service': return <Wrench className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-blue-600';
    return 'text-gray-600';
  };

  // Mock additional recommendations
  const aiInsights = [
    {
      title: 'Optimal Lunch Time',
      description: 'Based on your schedule, 12:30 PM - 1:15 PM is ideal for lunch near Midtown',
      impact: 'Saves 15 minutes',
      type: 'time',
    },
    {
      title: 'Cost Optimization',
      description: 'Using public transit for tomorrow can save you ₹45 in total',
      impact: '₹45 savings',
      type: 'cost',
    },
    {
      title: 'Route Efficiency',
      description: 'Reorder your afternoon meetings to reduce travel time by 30%',
      impact: '25 min saved',
      type: 'route',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Smart Recommendations</h1>
        <p className="text-gray-600">AI-powered suggestions based on your schedule and preferences</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search recommendations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full md:w-auto">
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
          AI-Powered Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights.map((insight, idx) => (
            <Card key={idx} className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">{insight.title}</h3>
                    <p className="text-sm text-blue-700 mb-2">{insight.description}</p>
                    <Badge className="bg-blue-600 text-white">{insight.impact}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Location Recommendations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Location-Based Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecommendations.map((rec) => (
            <Card key={rec.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      {getTypeIcon(rec.type)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{rec.name}</CardTitle>
                      <Badge variant="outline" className="mt-1 capitalize text-xs">
                        {rec.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{rec.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{rec.rating}</span>
                    </div>
                    <span className="text-sm text-gray-600">{rec.distance} km away</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">{rec.priceRange}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Relevance:</span>
                      <span className={`text-sm font-semibold ${getRelevanceColor(rec.relevanceScore)}`}>
                        {(rec.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${rec.relevanceScore * 100}%` }}
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRecommendations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Filter className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">No recommendations found</p>
              <p className="text-sm text-gray-400">Try adjusting your search filters</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Personalized Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Personalized Tips
          </CardTitle>
          <CardDescription>Based on your travel patterns and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">💡</span>
              </div>
              <div>
                <p className="font-medium text-sm">Peak Hours Alert</p>
                <p className="text-xs text-gray-600">
                  Your frequent route has heavy traffic between 8-9 AM. Consider leaving 20 minutes earlier.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">🎯</span>
              </div>
              <div>
                <p className="font-medium text-sm">Favorite Spot Nearby</p>
                <p className="text-xs text-gray-600">
                  Your preferred coffee shop "Blue Bean Café" is 0.2 km from your next meeting location.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">⚡</span>
              </div>
              <div>
                <p className="font-medium text-sm">Budget Optimization</p>
                <p className="text-xs text-gray-600">
                  Switching to monthly transit pass could save you ₹87 based on your usage pattern.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
