import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Play, RotateCcw } from 'lucide-react';
import { storage } from '../utils/storage';

export default function SettingsPage() {
  const { user } = useAuth();

  const handleRestartTour = () => {
    if (!user) return;
    
    // Сохраняем имя тура для запуска после редиректа
    const tourName = `${user.role}-onboarding`;
    storage.setItem('pending_tour', tourName);
    
    // Перенаправляем на dashboard, где тур найдет нужные элементы
    window.location.href = '/dashboard';
  };

  const handleResetOnboarding = () => {
    if (!user) return;
    
    // Удаляем флаг завершения онбординга
    storage.removeItem(`onboarding_completed_${user.id}`);
    
    // Перенаправляем на dashboard, где тур найдет нужные элементы
    window.location.href = '/dashboard';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      {/* Onboarding Section */}
      <div className="bg-white rounded-2xl shadow-card p-6 max-w-xl space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Onboarding & Tour</h2>
        <p className="text-sm text-gray-600 mb-4">
          Restart the platform tour or reset the complete onboarding experience.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleRestartTour}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Restart Tour
          </Button>
          
          <Button
            onClick={handleResetOnboarding}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Complete Onboarding
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          The tour will guide you through the main features of your {user?.role || 'user'} dashboard.
          {' '}Note: Settings are stored in {storage.getItem('__storage_test__') !== null ? 'browser storage' : 'session memory'}.
        </p>
      </div>
    </div>
  );
}

