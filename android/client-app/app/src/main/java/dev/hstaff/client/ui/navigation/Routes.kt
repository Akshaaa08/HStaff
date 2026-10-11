package dev.hstaff.client.ui.navigation

// All screen route destinations as string constants.
// Use these instead of raw strings to prevent typos.
object Routes {
    const val SPLASH          = "splash"
    const val WELCOME         = "welcome"
    const val ROLE            = "role"
    const val AUTH_PHONE      = "auth_phone"
    const val AUTH_OTP        = "auth_otp/{phone}"
    const val HOME            = "home"
    const val DISCOVER        = "discover"
    const val MODE            = "mode"               // booking step 1
    const val REQUIREMENTS    = "requirements"        // booking step 2
    const val MATERIALS       = "materials"           // booking step 2b
    const val LOCATION        = "location"            // booking step 3
    const val PROFESSIONALS   = "professionals"       // booking step 4
    const val PRO_PROFILE     = "pro_profile/{proId}" // booking step 4 detail
    const val SUMMARY         = "summary"             // booking step 5
    const val SERVICE_STATUS  = "service_status"      // live booking state
    const val PAYMENT         = "payment"
    const val RATING          = "rating"
    const val COMPLETE        = "complete"
    const val BOOKINGS        = "bookings"
    const val PROFILE         = "profile"
    const val NOTIFICATIONS   = "notifications"

    // Helpers to build parameterised routes
    fun authOtp(phone: String) = "auth_otp/$phone"
    fun proProfile(proId: String) = "pro_profile/$proId"
}
