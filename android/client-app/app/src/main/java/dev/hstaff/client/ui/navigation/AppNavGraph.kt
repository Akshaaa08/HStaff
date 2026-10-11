package dev.hstaff.client.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import dev.hstaff.client.ui.ClientViewModel
import dev.hstaff.client.ui.screens.auth.AuthOtpScreen
import dev.hstaff.client.ui.screens.auth.AuthPhoneScreen
import dev.hstaff.client.ui.screens.booking.LocationScreen
import dev.hstaff.client.ui.screens.booking.MaterialsScreen
import dev.hstaff.client.ui.screens.booking.ModeScreen
import dev.hstaff.client.ui.screens.booking.RequirementsScreen
import dev.hstaff.client.ui.screens.booking.SummaryScreen
import dev.hstaff.client.ui.screens.booking.ProfessionalsScreen
import dev.hstaff.client.ui.screens.booking.ProfessionalProfileScreen
import dev.hstaff.client.ui.screens.home.HomeScreen
import dev.hstaff.client.ui.screens.payment.BookingsScreen
import dev.hstaff.client.ui.screens.payment.CompleteScreen
import dev.hstaff.client.ui.screens.payment.NotificationsScreen
import dev.hstaff.client.ui.screens.payment.PaymentScreen
import dev.hstaff.client.ui.screens.payment.ProfileScreen
import dev.hstaff.client.ui.screens.payment.RatingScreen
import dev.hstaff.client.ui.screens.service.ServiceStatusScreen
import dev.hstaff.client.ui.screens.splash.SplashScreen
import dev.hstaff.client.ui.screens.welcome.DiscoverScreen
import dev.hstaff.client.ui.screens.welcome.WelcomeScreen

@Composable
fun AppNavGraph(
    navController: NavHostController = rememberNavController(),
    viewModel: ClientViewModel = viewModel(),
) {
    val session by viewModel.session.collectAsState()

    NavHost(
        navController = navController,
        startDestination = Routes.SPLASH,
    ) {

        composable(Routes.SPLASH) {
            SplashScreen(
                isAuthenticated = session.authenticated,
                onNavigateToHome = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.SPLASH) { inclusive = true }
                    }
                },
                onNavigateToWelcome = {
                    navController.navigate(Routes.WELCOME) {
                        popUpTo(Routes.SPLASH) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.WELCOME) {
            WelcomeScreen(
                onGetStarted = { navController.navigate(Routes.AUTH_PHONE) },
                onLogin = { navController.navigate(Routes.AUTH_PHONE) },
            )
        }

        composable(Routes.AUTH_PHONE) {
            AuthPhoneScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onOtpSent = { phone ->
                    navController.navigate(Routes.authOtp(phone))
                },
            )
        }

        composable(
            route = Routes.AUTH_OTP,
            arguments = listOf(navArgument("phone") { type = NavType.StringType }),
        ) { backStackEntry ->
            val phone = backStackEntry.arguments?.getString("phone") ?: ""
            AuthOtpScreen(
                viewModel = viewModel,
                phone = phone,
                onBack = { navController.popBackStack() },
                onAuthenticated = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.WELCOME) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.HOME) {
            HomeScreen(
                viewModel = viewModel,
                onServiceSelected = { service ->
                    viewModel.selectService(service)
                    navController.navigate(Routes.MODE)
                },
                onBookingClicked = { navController.navigate(Routes.SERVICE_STATUS) },
                onNotificationsClicked = { navController.navigate(Routes.NOTIFICATIONS) },
                onProfileClicked = { navController.navigate(Routes.PROFILE) },
                onDiscoverClicked = { navController.navigate(Routes.DISCOVER) },
                onProfessionalClicked = { proId ->
                    navController.navigate(Routes.proProfile(proId))
                },
            )
        }

        composable(Routes.DISCOVER) {
            DiscoverScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onServiceSelected = { service ->
                    viewModel.selectService(service)
                    navController.navigate(Routes.MODE)
                },
            )
        }

        // ── Booking flow ──────────────────────────────────────────────────────

        composable(Routes.MODE) {
            ModeScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onContinue = { navController.navigate(Routes.REQUIREMENTS) },
            )
        }

        composable(Routes.REQUIREMENTS) {
            RequirementsScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onContinue = { navController.navigate(Routes.MATERIALS) },
            )
        }

        composable(Routes.MATERIALS) {
            MaterialsScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onContinue = { navController.navigate(Routes.LOCATION) },
            )
        }

        composable(Routes.LOCATION) {
            LocationScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onContinue = { navController.navigate(Routes.PROFESSIONALS) },
            )
        }

        composable(Routes.PROFESSIONALS) {
            ProfessionalsScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onSelectProfessional = { proId ->
                    navController.navigate(Routes.proProfile(proId))
                },
            )
        }

        composable(
            route = Routes.PRO_PROFILE,
            arguments = listOf(navArgument("proId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val proId = backStackEntry.arguments?.getString("proId") ?: "sunita"
            ProfessionalProfileScreen(
                viewModel = viewModel,
                proId = proId,
                onBack = { navController.popBackStack() },
                onRequest = {
                    viewModel.updateDraft { it.copy(selectedProId = proId) }
                    navController.navigate(Routes.SUMMARY)
                },
            )
        }

        composable(Routes.SUMMARY) {
            SummaryScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onRequestSent = {
                    navController.navigate(Routes.SERVICE_STATUS) {
                        popUpTo(Routes.HOME) { inclusive = false }
                    }
                },
            )
        }

        composable(Routes.SERVICE_STATUS) {
            ServiceStatusScreen(
                viewModel = viewModel,
                onBack = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.HOME) { inclusive = false }
                    }
                },
                onNavigateToPayment = { navController.navigate(Routes.PAYMENT) },
                onNavigateToDiscover = {
                    navController.navigate(Routes.DISCOVER) {
                        popUpTo(Routes.HOME) { inclusive = false }
                    }
                },
            )
        }

        composable(Routes.PAYMENT) {
            PaymentScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onPaymentSuccess = {
                    navController.navigate(Routes.RATING) {
                        popUpTo(Routes.SERVICE_STATUS) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.RATING) {
            RatingScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onSubmitted = {
                    navController.navigate(Routes.COMPLETE) {
                        popUpTo(Routes.PAYMENT) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.COMPLETE) {
            CompleteScreen(
                viewModel = viewModel,
                onHome = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onViewBookings = {
                    navController.navigate(Routes.BOOKINGS) {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.BOOKINGS) {
            BookingsScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onBookingClicked = { navController.navigate(Routes.SERVICE_STATUS) },
            )
        }

        composable(Routes.PROFILE) {
            ProfileScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onLogout = {
                    viewModel.logout()
                    navController.navigate(Routes.WELCOME) {
                        popUpTo(0) { inclusive = true }
                    }
                },
                onNotifications = { navController.navigate(Routes.NOTIFICATIONS) },
                onBookings = { navController.navigate(Routes.BOOKINGS) },
            )
        }

        composable(Routes.NOTIFICATIONS) {
            NotificationsScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
            )
        }
    }
}
