import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Filter,
  Clock,
  MapPin,
  Video,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import Loader from '../components/Loader';
import { getCalendarEvents } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Event, EventType } from '../types';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '../types';

interface CalendarDay {
  date: Date;
  events: Event[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

export default function Calendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType | 'all'>('all');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const eventsData = await getCalendarEvents(year, month);
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();

    // Get first day of the week (Monday = 1, Sunday = 0)
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    // Generate 42 days (6 weeks)
    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_datetime);
        return eventDate.toDateString() === date.toDateString();
      });

      // Apply event type filter
      const filteredEvents = eventTypeFilter === 'all' 
        ? dayEvents 
        : dayEvents.filter(event => event.event_type === eventTypeFilter);

      days.push({
        date,
        events: filteredEvents,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }

    return days;
  };

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeColor = (eventType: EventType) => {
    return EVENT_TYPE_COLORS[eventType] || 'bg-gray-100 text-gray-800';
  };

  const calendarDays = generateCalendarDays();

  if (loading && events.length === 0) {
    return <Loader size="xl" animation="spin" color="#2563eb" />;
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline">Event Calendar</span>
              <span className="sm:hidden">Calendar</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600">View schedule and events</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {user?.role === 'admin' && (
              <Button 
                onClick={() => navigate('/admin/events/create')}
                className="flex items-center gap-2 w-full sm:w-auto"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Event</span>
                <span className="sm:hidden">Create</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <div className="flex flex-col gap-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center min-w-[150px] sm:min-w-[200px]">
                <span className="hidden sm:inline">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                <span className="sm:hidden">{monthNames[currentDate.getMonth()].slice(0, 3)} {currentDate.getFullYear()}</span>
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="text-xs sm:text-sm"
            >
              Today
            </Button>
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <Select value={eventTypeFilter} onValueChange={(value) => setEventTypeFilter(value as EventType | 'all')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="class">Classes</SelectItem>
                <SelectItem value="weekly_test">Weekly Tests</SelectItem>
                <SelectItem value="webinar">Webinars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {dayNames.map(day => (
            <div key={day} className="p-2 sm:p-3 text-center font-medium text-gray-700 border-r last:border-r-0 text-xs sm:text-sm">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.slice(0, 1)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`
                min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b last:border-r-0 cursor-pointer
                hover:bg-gray-50 transition-colors touch-manipulation
                ${!day.isCurrentMonth ? 'bg-gray-50' : ''}
                ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
                ${day.isWeekend && day.isCurrentMonth ? 'bg-gray-25' : ''}
              `}
              onClick={() => day.events.length > 0 && setSelectedDay(day)}
            >
              <div className={`
                text-xs sm:text-sm font-medium mb-1
                ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                ${day.isToday ? 'text-blue-600 font-bold' : ''}
              `}>
                {day.date.getDate()}
              </div>
              
              {/* Events */}
              <div className="space-y-0.5 sm:space-y-1">
                {day.events.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`
                      text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer
                      ${getEventTypeColor(event.event_type)}
                    `}
                    title={`${event.title} - ${formatTime(event.start_datetime)}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="truncate text-xs">{event.title}</span>
                    </div>
                    <div className="text-xs opacity-75 hidden sm:block">
                      {formatTime(event.start_datetime)}
                    </div>
                  </div>
                ))}
                
                {day.events.length > 2 && (
                  <div className="text-xs text-gray-500 text-center py-0.5 sm:py-1">
                    +{day.events.length - 2} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Event Types:</h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-100 border border-blue-200 flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-gray-600">Classes</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-yellow-100 border border-yellow-200 flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-gray-600">Weekly Tests</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-100 border border-red-200 flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-gray-600">Webinars</span>
          </div>
        </div>
      </div>

      {/* Day Events Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl mx-4 sm:mx-0 max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl">
              Events on {selectedDay?.date.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto flex-1">
            {selectedDay?.events.map(event => (
              <div key={event.id} className="border rounded-lg p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base flex-1 min-w-0">{event.title}</h3>
                  <Badge className={`${getEventTypeColor(event.event_type)} border text-xs flex-shrink-0`}>
                    {EVENT_TYPE_LABELS[event.event_type]}
                  </Badge>
                </div>
                
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2">
                      {event.is_online ? <Video className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" /> : <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  
                  {event.groups && event.groups.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{event.groups.join(', ')}</span>
                    </div>
                  )}
                </div>
                
                {event.description && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
