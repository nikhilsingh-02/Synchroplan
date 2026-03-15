import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield,
  Zap,
  Save,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useGoogleCalendarSync } from '../../hooks/useGoogleCalendarSync';


export const Settings: React.FC = () => {
  const { userPreferences, updatePreferences, budget, setBudget } = useApp();
  const { signInWithGoogle, hasCalendarAccess } = useAuth();
  const {
    syncGoogleCalendar,
    isSyncing,
    lastSyncedAt,
    importedCount,
    error: syncError,
  } = useGoogleCalendarSync();
  

  const [localPrefs, setLocalPrefs] = useState(userPreferences);
  const [localBudget, setLocalBudget] = useState(budget);
  const [notifications, setNotifications] = useState({
    conflicts: true,
    budgetAlerts: true,
    trafficUpdates: true,
    recommendations: false,
  });

  const handleSave = () => {
    updatePreferences(localPrefs);
    setBudget(localBudget);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your preferences and account settings</p>
      </div>

      {/* User Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Preferences
          </CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="transport">Preferred Transportation</Label>
              <Select 
                value={localPrefs.preferredTransport} 
                onValueChange={(value) => setLocalPrefs({ ...localPrefs, preferredTransport: value })}
              >
                <SelectTrigger id="transport">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driving">Driving</SelectItem>
                  <SelectItem value="transit">Public Transit</SelectItem>
                  <SelectItem value="walking">Walking</SelectItem>
                  <SelectItem value="cycling">Cycling</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Default transportation mode for route planning</p>
            </div>

            <div>
              <Label htmlFor="budget">Monthly Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                value={localBudget}
                onChange={(e) => setLocalBudget(parseFloat(e.target.value))}
                min="0"
                step="10"
              />
              <p className="text-xs text-gray-500 mt-1">Set your monthly spending limit</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="priority-mode">Priority Mode</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically prioritize high-priority events in conflict resolution
                </p>
              </div>
              <Switch
                id="priority-mode"
                checked={localPrefs.priorityMode}
                onCheckedChange={(checked) => setLocalPrefs({ ...localPrefs, priorityMode: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notif-conflicts">Schedule Conflicts</Label>
              <p className="text-xs text-gray-500 mt-1">Get notified about scheduling conflicts</p>
            </div>
            <Switch
              id="notif-conflicts"
              checked={notifications.conflicts}
              onCheckedChange={(checked) => setNotifications({ ...notifications, conflicts: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notif-budget">Budget Alerts</Label>
              <p className="text-xs text-gray-500 mt-1">Alerts when approaching budget limit</p>
            </div>
            <Switch
              id="notif-budget"
              checked={notifications.budgetAlerts}
              onCheckedChange={(checked) => setNotifications({ ...notifications, budgetAlerts: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notif-traffic">Traffic Updates</Label>
              <p className="text-xs text-gray-500 mt-1">Real-time traffic and delay notifications</p>
            </div>
            <Switch
              id="notif-traffic"
              checked={notifications.trafficUpdates}
              onCheckedChange={(checked) => setNotifications({ ...notifications, trafficUpdates: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notif-recommendations">Smart Recommendations</Label>
              <p className="text-xs text-gray-500 mt-1">AI-powered suggestions and tips</p>
            </div>
            <Switch
              id="notif-recommendations"
              checked={notifications.recommendations}
              onCheckedChange={(checked) => setNotifications({ ...notifications, recommendations: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI & Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI & Optimization
          </CardTitle>
          <CardDescription>Advanced features and automation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-resolve">Auto-Resolve Conflicts</Label>
              <p className="text-xs text-gray-500 mt-1">
                Automatically resolve low-priority conflicts
              </p>
            </div>
            <Switch id="auto-resolve" defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="smart-routes">Smart Route Suggestions</Label>
              <p className="text-xs text-gray-500 mt-1">
                AI-powered route optimization based on your patterns
              </p>
            </div>
            <Switch id="smart-routes" defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="predictive">Predictive Scheduling</Label>
              <p className="text-xs text-gray-500 mt-1">
                Learn from your behavior to suggest optimal times
              </p>
            </div>
            <Switch id="predictive" defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="cost-optimize">Cost Optimization</Label>
              <p className="text-xs text-gray-500 mt-1">
                Automatically suggest cost-effective alternatives
              </p>
            </div>
            <Switch id="cost-optimize" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>Manage your data and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="location-sharing">Location Sharing</Label>
              <p className="text-xs text-gray-500 mt-1">
                Share location for better recommendations
              </p>
            </div>
            <Switch id="location-sharing" defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="analytics">Usage Analytics</Label>
              <p className="text-xs text-gray-500 mt-1">
                Help improve the system with anonymous usage data
              </p>
            </div>
            <Switch id="analytics" defaultChecked />
          </div>

          <Separator />

          <div className="space-y-3 pt-2">
            <Button variant="outline" className="w-full">
              Export My Data
            </Button>
            <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>Sync events from Google Calendar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasCalendarAccess ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Connect your Google account to automatically import calendar events
                into SynchroPlan for route optimization and conflict detection.
              </p>
              <Button
                id="connect-google-calendar"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const { error } = await signInWithGoogle();
                  if (error) {
                    toast.error(`Failed to connect: ${error.message}`);
                  }
                  // On success the browser redirects — no further action needed
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Connect Google Calendar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connection status */}
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Google Calendar connected</p>
                    {lastSyncedAt && (
                      <p className="text-xs text-green-700">
                        Last synced: {lastSyncedAt.toLocaleString()} · {importedCount} events
                      </p>
                    )}
                    {!lastSyncedAt && (
                      <p className="text-xs text-green-700">Ready to sync</p>
                    )}
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
              </div>

              {/* Sync error */}
              {syncError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{syncError}</p>
                </div>
              )}

              {/* Sync now button */}
              <Button
                id="sync-google-calendar"
                variant="outline"
                className="w-full"
                disabled={isSyncing}
                onClick={async () => {
                  await syncGoogleCalendar();
                  if (!syncError) {
                    toast.success(`Synced ${importedCount} events from Google Calendar`);
                  }
                }}
              >
                {isSyncing
                  ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  : <RefreshCw className="h-4 w-4 mr-2" />}
                {isSyncing ? 'Syncing…' : 'Sync Now'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>


      <div className="flex justify-end gap-2 sticky bottom-6">
        <Button variant="outline" onClick={() => {
          setLocalPrefs(userPreferences);
          setLocalBudget(budget);
          toast.info('Changes discarded');
        }}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};
