import React from 'react';
import { Badge } from '../ui/badge';
import { RecommendationActions } from './RecommendationActions';

export const RecommendationCard: React.FC<{ insight: any, onIgnore: (id: string) => void }> = ({ insight, onIgnore }) => {
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm flex flex-col gap-3 transition-colors hover:border-gray-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{insight.title}</h4>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            {insight.description}
          </p>
          
          {insight.category === 'PLACE_SUGGESTION' && (
            <div className="flex items-center gap-3 mt-3">
              <Badge variant="outline" className="text-xs bg-gray-50">
                ⭐ {insight.rating || 'New'}
              </Badge>
              {insight.distance !== undefined && (
                <span className="text-xs text-gray-500 font-medium">
                  {insight.distance.toFixed(1)} km away
                </span>
              )}
            </div>
          )}
          
          {insight.impact && insight.category !== 'PLACE_SUGGESTION' && (
            <Badge variant="secondary" className="mt-3 text-xs">
              {insight.impact}
            </Badge>
          )}
        </div>
        
        {insight.severity && oversightSeverityColor(insight.severity)}
      </div>
      
      <div className="pt-2">
        <RecommendationActions insight={insight} onIgnore={onIgnore} />
      </div>
    </div>
  );
};

function oversightSeverityColor(severity: string) {
  switch (severity) {
    case 'high':
      return <Badge variant="destructive">High Priority</Badge>;
    case 'medium':
      return <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700">Notice</Badge>;
    case 'low':
      return <Badge variant="secondary">Tip</Badge>;
    default:
      return null;
  }
}
