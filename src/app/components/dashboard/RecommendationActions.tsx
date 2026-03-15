import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { MapPin, CalendarPlus, Zap, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export const RecommendationActions: React.FC<{ insight: any, onIgnore: (id: string) => void }> = ({ insight, onIgnore }) => {
  const navigate = useNavigate();
  const { addEvent, updateEvent, events, resolveConflict } = useApp();
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  
  // For prefilled Add Event modal
  const [formData, setFormData] = useState({
    title: insight.title || '',
    location: insight.description || '',
    startTime: '',
    endTime: '',
    priority: 'medium' as any,
    type: 'personal' as any,
    notes: '',
  });

  const handleOpenAddEvent = (title: string, location: string) => {
    setFormData({ ...formData, title, location });
    setAddEventOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEvent({
      ...formData,
      latitude: insight.placeObj?.latitude,
      longitude: insight.placeObj?.longitude,
    });
    toast.success('Added to schedule');
    setAddEventOpen(false);
    onIgnore(insight.id); // hide recommendation
  };

  const handleApplyOptimization = () => {
    if (!insight.optimizationDetails?.optimizedOrder) return;
    const { optimizedOrder } = insight.optimizationDetails;
    
    optimizedOrder.forEach((updatedEvent: any) => {
      updateEvent(updatedEvent.id, {
        startTime: updatedEvent.startTime,
        endTime: updatedEvent.endTime
      });
    });
    toast.success('Schedule optimized!');
    onIgnore(insight.id);
  };

  const handleAddBreak = () => {
    if (!insight.relatedEventIds || insight.relatedEventIds.length < 2) return;
    const ev1 = events.find(e => e.id === insight.relatedEventIds[0]);
    const ev2 = events.find(e => e.id === insight.relatedEventIds[1]);
    if (!ev1 || !ev2) return;

    addEvent({
      title: 'Break',
      location: '',
      startTime: ev1.endTime,
      endTime: ev2.startTime,
      priority: 'low',
      type: 'personal'
    });
    toast.success('Break added');
    onIgnore(insight.id);
  };

  const handleResolveConflict = () => {
    if (insight.conflictObj) {
      resolveConflict(insight.conflictObj.id, 'auto');
      toast.success('Conflict resolved automatically');
      onIgnore(insight.id);
      setConflictOpen(false);
    }
  };

  if (insight.category === 'PLACE_SUGGESTION') {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <Button size="sm" variant="outline" onClick={() => navigate(`/travel-planner?lat=${insight.placeObj?.latitude}&lng=${insight.placeObj?.longitude}&destination=${encodeURIComponent(insight.title)}`)}>
          <MapPin className="h-4 w-4 mr-2" />
          View Route
        </Button>

        <Dialog open={addEventOpen} onOpenChange={setAddEventOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="default" onClick={() => handleOpenAddEvent(insight.title, insight.description)}>
              <CalendarPlus className="h-4 w-4 mr-2" />
              Add to Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Schedule</DialogTitle>
              <DialogDescription>Schedule a visit to {insight.title}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input value={formData.title} onChange={(e: any) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label>Location</Label>
                  <Input value={formData.location} onChange={(e: any) => setFormData({ ...formData, location: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Start Time</Label>
                    <Input type="datetime-local" value={formData.startTime} onChange={(e: any) => setFormData({ ...formData, startTime: e.target.value })} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>End Time</Label>
                    <Input type="datetime-local" value={formData.endTime} onChange={(e: any) => setFormData({ ...formData, endTime: e.target.value })} required />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddEventOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Placeholder for details per prompt */}
        <Button size="sm" variant="ghost" onClick={() => navigate('/recommendations')}>
          Details
        </Button>
      </div>
    );
  }

  if (insight.category === 'SCHEDULE_REORDER_SUGGESTION') {
    return (
      <div className="flex gap-2 mt-2">
        <Button size="sm" variant="default" onClick={handleApplyOptimization}>
          <Zap className="h-4 w-4 mr-2" />
          Apply Optimization
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onIgnore(insight.id)}>
          Dismiss
        </Button>
      </div>
    );
  }

  if (insight.category === 'SCHEDULE_GAP_SUGGESTION') {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <Button size="sm" variant="outline" onClick={() => navigate('/recommendations')}>
          <MapPin className="h-4 w-4 mr-2" />
          Fill With Nearby Place
        </Button>
        <Button size="sm" variant="default" onClick={handleAddBreak}>
          <CalendarPlus className="h-4 w-4 mr-2" />
          Add Break
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onIgnore(insight.id)}>
          Ignore
        </Button>
      </div>
    );
  }

  if (insight.category === 'CONFLICT_WARNING') {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <Dialog open={conflictOpen} onOpenChange={setConflictOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="destructive">
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolve Conflict
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Conflict</DialogTitle>
              <DialogDescription>{insight.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 border-b">
              <p className="text-sm font-medium">Suggested Fixes:</p>
              <ul className="text-sm text-gray-600 list-disc pl-5">
                {insight.conflictObj?.suggestions?.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConflictOpen(false)}>Cancel</Button>
              <Button onClick={handleResolveConflict}>Apply Fix</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button size="sm" variant="outline" onClick={() => navigate('/schedule')}>
          <Zap className="h-4 w-4 mr-2" />
          Auto-Optimize Schedule
        </Button>
      </div>
    );
  }

  // Fallback for general insights
  return (
    <div className="flex gap-2 mt-2">
      <Button size="sm" variant="outline" onClick={() => onIgnore(insight.id)}>
        <XCircle className="h-4 w-4 mr-2" />
        Dismiss
      </Button>
    </div>
  );
};
