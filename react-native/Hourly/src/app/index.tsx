import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SplashScreen } from '../screens/SplashScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { AuthPhoneScreen } from '../screens/AuthPhoneScreen';
import { AuthOtpScreen } from '../screens/AuthOtpScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { BookingsScreen } from '../screens/BookingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ModeScreen } from '../screens/booking/ModeScreen';
import { RequirementsScreen } from '../screens/booking/RequirementsScreen';
import { MaterialsScreen } from '../screens/booking/MaterialsScreen';
import { LocationScreen } from '../screens/booking/LocationScreen';
import { ProfessionalsScreen } from '../screens/booking/ProfessionalsScreen';
import { ProfessionalProfileScreen } from '../screens/booking/ProfessionalProfileScreen';
import { SummaryScreen } from '../screens/booking/SummaryScreen';
import { ServiceStatusScreen } from '../screens/service/ServiceStatusScreen';
import { PaymentScreen } from '../screens/payment/PaymentScreen';
import { RatingScreen } from '../screens/payment/RatingScreen';
import { CompleteScreen } from '../screens/payment/CompleteScreen';
import { BottomNavBar, TabScreen } from '../components/common/BottomNavBar';

export type ScreenRoute =
  | 'splash'
  | 'welcome'
  | 'auth_phone'
  | 'auth_otp'
  | 'home'
  | 'discover'
  | 'bookings'
  | 'profile'
  | 'notifications'
  | 'booking_mode'
  | 'booking_requirements'
  | 'booking_materials'
  | 'booking_location'
  | 'booking_professionals'
  | 'booking_pro_profile'
  | 'booking_summary'
  | 'service_status'
  | 'payment'
  | 'rating'
  | 'complete';

export default function AppMain() {
  const { session } = useApp();
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>('splash');
  const [routeStack, setRouteStack] = useState<ScreenRoute[]>(['splash']);
  const [authPhone, setAuthPhone] = useState<string>('');
  const [selectedProId, setSelectedProId] = useState<string>('sunita');

  const navigate = (to: ScreenRoute) => {
    setRouteStack((prev) => [...prev, to]);
    setCurrentRoute(to);
  };

  const goBack = () => {
    if (routeStack.length > 1) {
      const nextStack = [...routeStack];
      nextStack.pop();
      const prevRoute = nextStack[nextStack.length - 1];
      setRouteStack(nextStack);
      setCurrentRoute(prevRoute);
    } else {
      setCurrentRoute('home');
    }
  };

  const isMainTab = ['home', 'discover', 'bookings', 'profile'].includes(currentRoute);

  const handleTabSelect = (tab: TabScreen) => {
    setRouteStack([tab]);
    setCurrentRoute(tab);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Screens */}
        {currentRoute === 'splash' && (
          <SplashScreen
            isAuthenticated={session.authenticated}
            onFinish={(target) => {
              const start = target === 'home' ? 'home' : 'welcome';
              setRouteStack([start]);
              setCurrentRoute(start);
            }}
          />
        )}

        {currentRoute === 'welcome' && (
          <WelcomeScreen
            onGetStarted={() => navigate('auth_phone')}
            onLogin={() => navigate('auth_phone')}
          />
        )}

        {currentRoute === 'auth_phone' && (
          <AuthPhoneScreen
            onBack={goBack}
            onOtpSent={(phone) => {
              setAuthPhone(phone);
              navigate('auth_otp');
            }}
          />
        )}

        {currentRoute === 'auth_otp' && (
          <AuthOtpScreen
            phone={authPhone}
            onBack={goBack}
            onAuthenticated={() => {
              setRouteStack(['home']);
              setCurrentRoute('home');
            }}
          />
        )}

        {currentRoute === 'home' && (
          <HomeScreen
            onServiceSelected={(service) => navigate('booking_mode')}
            onBookingClicked={() => navigate('service_status')}
            onNotificationsClicked={() => navigate('notifications')}
            onProfileClicked={() => handleTabSelect('profile')}
            onDiscoverClicked={() => handleTabSelect('discover')}
            onProfessionalClicked={(proId) => {
              setSelectedProId(proId);
              navigate('booking_pro_profile');
            }}
          />
        )}

        {currentRoute === 'discover' && (
          <DiscoverScreen
            onServiceSelected={(service) => navigate('booking_mode')}
          />
        )}

        {currentRoute === 'bookings' && (
          <BookingsScreen
            onBookingClicked={() => navigate('service_status')}
            onDiscoverClicked={() => handleTabSelect('discover')}
          />
        )}

        {currentRoute === 'profile' && (
          <ProfileScreen
            onLogout={() => {
              setRouteStack(['welcome']);
              setCurrentRoute('welcome');
            }}
            onNotifications={() => navigate('notifications')}
            onBookings={() => handleTabSelect('bookings')}
          />
        )}

        {currentRoute === 'notifications' && (
          <NotificationsScreen onBack={goBack} />
        )}

        {/* ── Booking Flow Screens ── */}
        {currentRoute === 'booking_mode' && (
          <ModeScreen onBack={goBack} onContinue={() => navigate('booking_requirements')} />
        )}

        {currentRoute === 'booking_requirements' && (
          <RequirementsScreen onBack={goBack} onContinue={() => navigate('booking_materials')} />
        )}

        {currentRoute === 'booking_materials' && (
          <MaterialsScreen onBack={goBack} onContinue={() => navigate('booking_location')} />
        )}

        {currentRoute === 'booking_location' && (
          <LocationScreen onBack={goBack} onContinue={() => navigate('booking_professionals')} />
        )}

        {currentRoute === 'booking_professionals' && (
          <ProfessionalsScreen
            onBack={goBack}
            onSelectProfessional={(proId) => {
              setSelectedProId(proId);
              navigate('booking_pro_profile');
            }}
          />
        )}

        {currentRoute === 'booking_pro_profile' && (
          <ProfessionalProfileScreen
            proId={selectedProId}
            onBack={goBack}
            onRequest={() => navigate('booking_summary')}
          />
        )}

        {currentRoute === 'booking_summary' && (
          <SummaryScreen
            onBack={goBack}
            onConfirmed={() => {
              setRouteStack(['home', 'service_status']);
              setCurrentRoute('service_status');
            }}
          />
        )}

        {/* ── Service Status Lifecycle ── */}
        {currentRoute === 'service_status' && (
          <ServiceStatusScreen
            onBack={() => handleTabSelect('home')}
            onNavigateToPayment={() => navigate('payment')}
            onNavigateToDiscover={() => handleTabSelect('discover')}
          />
        )}

        {/* ── Payment, Rating, Complete ── */}
        {currentRoute === 'payment' && (
          <PaymentScreen
            onBack={goBack}
            onPaymentSuccess={() => navigate('rating')}
          />
        )}

        {currentRoute === 'rating' && (
          <RatingScreen
            onBack={goBack}
            onSubmitted={() => navigate('complete')}
          />
        )}

        {currentRoute === 'complete' && (
          <CompleteScreen
            onViewBookings={() => handleTabSelect('bookings')}
            onHome={() => handleTabSelect('home')}
          />
        )}

        {/* Bottom Tab Bar for Main Tabs */}
        {isMainTab && (
          <BottomNavBar
            currentTab={currentRoute as TabScreen}
            onSelectTab={handleTabSelect}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
