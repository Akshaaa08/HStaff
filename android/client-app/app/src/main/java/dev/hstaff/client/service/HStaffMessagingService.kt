package dev.hstaff.client.service

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Handles incoming FCM push messages.
 * Declared in AndroidManifest.xml under the MESSAGING_EVENT intent-filter.
 */
class HStaffMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // TODO (M12): send token to backend — POST /api/v1/auth/push-token
        // This can only be done after the user has authenticated.
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        // TODO (M12): build a notification using NotificationCompat and display it.
        // Payload keys: title, body, type (booking_update | otp | payment)
    }
}
