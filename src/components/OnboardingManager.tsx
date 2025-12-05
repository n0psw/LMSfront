import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useNextStep } from 'nextstepjs';
import WelcomeScreens from './WelcomeScreens';
import OnboardingTour from './OnboardingTour';
import { storage } from '../utils/storage';
import apiClient from '../services/api';

interface OnboardingManagerProps {
  children: React.ReactNode;
}

export default function OnboardingManager({ children }: OnboardingManagerProps) {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const { startNextStep } = useNextStep();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [onboardingShownInSession, setOnboardingShownInSession] = useState(false);

  // Проверяем, есть ли pending_tour от перехода из настроек
  useEffect(() => {
    const pendingTour = storage.getItem('pending_tour');
    if (pendingTour && location.pathname === '/dashboard') {
      storage.removeItem('pending_tour');
      // Запускаем тур с небольшой задержкой, чтобы страница успела отрендериться
      setTimeout(() => {
        console.log('[OnboardingManager] Starting pending tour:', pendingTour);
        startNextStep(pendingTour);
      }, 500);
    }
  }, [location.pathname, startNextStep]);

  useEffect(() => {
    console.log('OnboardingManager state changed:', { showWelcome, showTour });
  }, [showWelcome, showTour]);

  useEffect(() => {
    // Определяем дашборды для каждой роли
    const getDashboardPathForRole = (role: string) => {
      switch (role) {
        case 'student':
          return '/dashboard';
        case 'teacher':
          return '/dashboard';
        case 'curator':
          return '/dashboard';
        case 'admin':
          return '/dashboard';
        default:
          return '/dashboard';
      }
    };

    // Проверяем, нужно ли показывать онбординг
    if (user && !onboardingShownInSession) {
      const userDashboard = getDashboardPathForRole(user.role);
      const isOnDashboard = location.pathname === userDashboard;
      
      if (isOnDashboard) {
        console.log('[OnboardingManager] Onboarding check:', {
          userId: user.id,
          userRole: user.role,
          hasCompleted: user.onboarding_completed,
          pathname: location.pathname,
          shownInSession: onboardingShownInSession
        });
        
        // Проверяем статус из данных пользователя (с сервера)
        if (!user.onboarding_completed) {
          // Показываем приветственные экраны
          console.log('[OnboardingManager] Starting onboarding flow for', user.role);
          setShowWelcome(true);
          setOnboardingShownInSession(true); // Помечаем, что уже показали в этой сессии
        } else {
          console.log('[OnboardingManager] Onboarding already completed, skipping...');
        }
      }
    }
  }, [user, location.pathname, onboardingShownInSession]);

  const handleWelcomeComplete = () => {
    console.log('Welcome screens completed, starting tour...');
    setShowWelcome(false);
    // После приветствия показываем тур с небольшой задержкой
    setTimeout(() => {
      console.log('Setting showTour to true');
      setShowTour(true);
    }, 500);
  };

  const handleTourComplete = async () => {
    console.log('Tour completed!');
    setShowTour(false);
    
    // Сохраняем статус на сервере
    if (user) {
      try {
        console.log('Calling completeOnboarding API for user:', user.id);
        const updatedUser = await apiClient.completeOnboarding();
        console.log('Onboarding API response:', updatedUser);
        console.log('Onboarding status saved on server for user:', user.id);
        
        // Обновляем пользователя в контексте с новыми данными
        console.log('Updating user in AuthContext with:', {
          id: updatedUser.id,
          onboarding_completed: updatedUser.onboarding_completed,
          onboarding_completed_at: updatedUser.onboarding_completed_at
        });
        updateUser(updatedUser);
        
        // Также сохраняем локально для быстрого доступа
        storage.setItem(`onboarding_completed_${user.id}`, 'true');
        console.log('Onboarding saved to localStorage');
      } catch (error) {
        console.error('Failed to save onboarding status:', error);
        // Сохраняем хотя бы локально, если сервер недоступен
        storage.setItem(`onboarding_completed_${user.id}`, 'true');
      }
    }
  };

  const userName = user?.full_name || user?.name || 'there';

  return (
    <>
      {showWelcome && user && (
        <WelcomeScreens 
          userName={userName} 
          userRole={user.role}
          onComplete={handleWelcomeComplete} 
        />
      )}
      
      {user && showTour && (
        <OnboardingTour
          userRole={user.role}
          steps={[]}
          isOpen={showTour}
          onComplete={handleTourComplete}
        />
      )}
      
      {children}
    </>
  );
}

