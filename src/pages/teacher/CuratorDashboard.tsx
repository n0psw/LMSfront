import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, BarChart3, Calendar } from 'lucide-react';
import Skeleton from '@/components/Skeleton';

export default function CuratorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data: any = await apiClient.getDashboardStats();
      setStats(data.stats || data || {});
    } catch (error) {
      console.error('Failed to load curator dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Curator';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {firstName}! 
        </h1>
        <p className="text-gray-600 mt-1">
          Here's an overview of your groups and students
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" data-tour="dashboard-overview">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Total Students</div>
                <div className="text-2xl font-bold">{stats?.total_students || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <GraduationCap className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">My Groups</div>
                <div className="text-2xl font-bold">{stats?.total_groups || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Avg Progress</div>
                <div className="text-2xl font-bold">{stats?.avg_completion_rate || 0}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Upcoming Events</div>
                <div className="text-2xl font-bold">{stats?.upcoming_events || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Section */}
      <Card data-tour="students-section">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Students</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/analytics')}
            >
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">
            Track your students' progress and provide support where needed. Access detailed
            analytics to identify students who may require additional help.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => navigate('/analytics')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
            <Button variant="outline" onClick={() => navigate('/chat')}>
              <Users className="w-4 h-4 mr-2" />
              Message Students
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Groups Section */}
      <Card data-tour="groups-section">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Manage Groups</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/calendar')}
            >
              Schedule Meeting
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">
            Organize and coordinate your student groups. Schedule meetings, track group
            activities, and manage group communications.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => navigate('/calendar')}>
              <Calendar className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
            <Button variant="outline" onClick={() => navigate('/analytics')}>
              <GraduationCap className="w-4 h-4 mr-2" />
              Group Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
