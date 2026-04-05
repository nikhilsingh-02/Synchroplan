import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Zap } from 'lucide-react';
import { RecommendationCard } from './RecommendationCard';
import { Link } from 'react-router';
import { Button } from '../ui/button';

export const SmartRecommendations: React.FC<{ insights: any[] }> = ({ insights }) => {
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());

  const handleIgnore = (id: string) => {
    setIgnoredIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const visibleInsights = insights.filter(i => !ignoredIds.has(i.id)).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Smart Assistant
        </CardTitle>
        <CardDescription>Interactive AI recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        {visibleInsights.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Zap className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>You're all set! No new recommendations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleInsights.map(insight => (
              <RecommendationCard key={insight.id} insight={insight} onIgnore={handleIgnore} />
            ))}
          </div>
        )}
        <div className="mt-4">
          <Link to="/recommendations">
            <Button variant="outline" className="w-full">
              View All Places & Recommendations
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
