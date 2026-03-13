import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertCircle, Calendar, Clock, MapPin, Plus, Trash2, Edit, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from "../../lib/supabase";

export const Schedule: React.FC = () => {

  const [events, setEvents] = useState<any[]>([]);

  const { conflicts, resolveConflict, updateEvent, deleteEvent } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    startTime: '',
    endTime: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    type: 'meeting' as 'meeting' | 'task' | 'travel' | 'personal',
    notes: '',
  });

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (editingEvent) {
    updateEvent(editingEvent, formData);
    toast.success("Event updated successfully");
  } else {
      const { data, error } = await supabase.from("events").insert([
        {
          title: formData.title,
          location: formData.location,
          start_time: formData.startTime,
          end_time: formData.endTime,
          priority: formData.priority,
          type: formData.type,
          notes: formData.notes,
        },
      ]);

      if (error) {
        console.error(error);
        toast.error("Failed to add event");
        return;
      }

      toast.success("Event added successfully");
    }

    setDialogOpen(false);
    resetForm();
};
  const resetForm = () => {
    setFormData({
      title: '',
      location: '',
      startTime: '',
      endTime: '',
      priority: 'medium',
      type: 'meeting',
      notes: '',
    });
    setEditingEvent(null);
  };

  const handleEdit = (event: any) => {
    setFormData({
      title: event.title,
      location: event.location,
      startTime: event.startTime,
      endTime: event.endTime,
      priority: event.priority,
      type: event.type,
      notes: event.notes || '',
    });
    setEditingEvent(event.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteEvent(id);
    toast.success('Event deleted');
  };

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule Manager</h1>
          <p className="text-gray-600">Manage your events and resolve conflicts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
              <DialogDescription>
                {editingEvent ? 'Update event details' : 'Create a new event in your schedule'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Team Meeting"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    placeholder="e.g., Conference Room A"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional details..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEvent ? 'Update Event' : 'Add Event'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Conflicts Section */}
      {conflicts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Active Conflicts ({conflicts.length})
          </h2>
          {conflicts.map((conflict) => (
            <Card key={conflict.id} className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-red-900">
                      {conflict.type.replace(/_/g, ' ').toUpperCase()}
                    </CardTitle>
                    <CardDescription className="text-red-700">
                      {conflict.description}
                    </CardDescription>
                  </div>
                  <Badge variant="destructive">{conflict.severity}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-900">Suggested Solutions:</p>
                  <ul className="space-y-1">
                    {conflict.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        resolveConflict(conflict.id, 'auto');
                        toast.success('Conflict resolved');
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Auto-Resolve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        resolveConflict(conflict.id, 'dismiss');
                        toast.info('Conflict dismissed');
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Timeline
          </CardTitle>
          <CardDescription>All scheduled events</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No events scheduled</p>
              <p className="text-sm">Click "Add Event" to create your first event</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    event.hasConflict ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge variant={getPriorityColor(event.priority)}>
                          {event.priority}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {event.type}
                        </Badge>
                        {event.hasConflict && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Conflict
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(parseISO(event.startTime), 'MMM d, h:mm a')} - 
                            {format(parseISO(event.endTime), 'h:mm a')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                        {event.notes && (
                          <p className="text-gray-500 mt-2 text-xs">{event.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
