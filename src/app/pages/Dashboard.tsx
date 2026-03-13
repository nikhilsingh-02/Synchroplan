import React, { useEffect } from "react";
import { useApp } from '../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { formatINR } from "../../utils/currency";
import { 
  Calendar, 
  MapPin, 
  IndianRupee, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Navigation,
  Zap,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router';

export const Dashboard: React.FC = () => {
  const { events, conflicts, expenses, budget, routes, recommendations } = useApp();

  const todayEvents = events.filter(event => {
    const eventDate = format(parseISO(event.startTime), 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    return eventDate === today;
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const budgetPercentage = (totalExpenses / budget) * 100;

  const upcomingEvent = todayEvents.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )[0];

  const highPriorityConflicts = conflicts.filter(c => c.severity === 'high');
  const optimalRoutes = routes.filter(r => r.status === 'optimal').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Alert Banner */}
      {highPriorityConflicts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">
                  {highPriorityConflicts.length} Critical Schedule Conflict{highPriorityConflicts.length > 1 ? 's' : ''} Detected
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {highPriorityConflicts[0].description}
                </p>
                <Link to="/schedule">
                  <Button variant="destructive" size="sm" className="mt-3">
                    Resolve Now
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Events
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayEvents.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {todayEvents.filter(e => e.priority === 'high').length} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Conflicts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{conflicts.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {highPriorityConflicts.length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Budget Status
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{budgetPercentage.toFixed(0)}%</div>
            <Progress value={budgetPercentage} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              {formatINR(totalExpenses)} of {formatINR(budget)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Optimal Routes
              </CardTitle>
              <Navigation className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{optimalRoutes}</div>
            <p className="text-xs text-gray-500 mt-1">
              Available routes analyzed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Event */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Next Event
            </CardTitle>
            <CardDescription>Upcoming in your schedule</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvent ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{upcomingEvent.title}</h3>
                    <Badge variant={upcomingEvent.priority === 'high' ? 'destructive' : 'secondary'}>
                      {upcomingEvent.priority}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(parseISO(upcomingEvent.startTime), 'h:mm a')} - 
                        {format(parseISO(upcomingEvent.endTime), 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{upcomingEvent.location}</span>
                    </div>
                  </div>
                </div>
                <Link to="/travel">
                  <Button className="w-full">
                    <Navigation className="h-4 w-4 mr-2" />
                    Plan Route
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No upcoming events today</p>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Smart Recommendations
            </CardTitle>
            <CardDescription>AI-powered suggestions for you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec) => (
                <div key={rec.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{rec.name}</h4>
                      <p className="text-sm text-gray-600">{rec.location}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          ⭐ {rec.rating}
                        </Badge>
                        <span className="text-xs text-gray-500">{rec.distance} km away</span>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      {rec.priceRange}
                    </div>
                  </div>
                </div>
              ))}
              <Link to="/recommendations">
                <Button variant="outline" className="w-full">
                  View All Recommendations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Recent Expenses
            </CardTitle>
            <CardDescription>Last transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.slice(-4).reverse().map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-xs text-gray-500 capitalize">{expense.category}</p>
                  </div>
                  <span className="font-semibold">{formatINR(expense.amount)}</span>
                </div>
              ))}
              <Link to="/expenses">
                <Button variant="outline" className="w-full">
                  Manage Expenses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Insights
            </CardTitle>
            <CardDescription>Your optimization stats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Schedule Efficiency</span>
                  <span className="text-sm font-semibold">87%</span>
                </div>
                <Progress value={87} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Travel Time Saved</span>
                  <span className="text-sm font-semibold">2.5 hrs</span>
                </div>
                <Progress value={65} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Cost Optimization</span>
                  <span className="text-sm font-semibold">{formatINR(124)} saved</span>
                </div>
                <Progress value={78} />
              </div>
              <div className="pt-2 text-sm text-gray-600">
                <p>💡 You're performing better than 78% of users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
