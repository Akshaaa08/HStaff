package dev.hstaff.client.ui.screens.payment

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bell
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LockOutlined
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.hstaff.client.domain.model.BookingStatus
import dev.hstaff.client.domain.model.formatInr
import dev.hstaff.client.domain.model.priceFor
import dev.hstaff.client.domain.model.professionalFor
import dev.hstaff.client.ui.ClientViewModel
import dev.hstaff.client.ui.components.GradientButton
import dev.hstaff.client.ui.components.ScreenTopBar
import dev.hstaff.client.ui.components.StatusChip
import dev.hstaff.client.ui.components.SubtleText
import dev.hstaff.client.ui.theme.hstaff

// ── Bookings screen ─────────────────────────────────────────────────────────

@Composable
fun BookingsScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onBookingClicked: () -> Unit,
) {
    val session by viewModel.session.collectAsState()
    var showPast by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Bookings", onBack = onBack)

        Text("Your helping hands.", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(4.dp))
        SubtleText("Every service, from first hello to a job well done.")

        Spacer(Modifier.height(20.dp))

        // Tab row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            listOf("Upcoming" to false, "Past" to true).forEach { (label, isPast) ->
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50.dp))
                        .background(
                            if (showPast == isPast) MaterialTheme.hstaff.peach
                            else MaterialTheme.hstaff.mutedBg
                        )
                        .clickable { showPast = isPast }
                        .padding(horizontal = 20.dp, vertical = 10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = if (showPast == isPast) FontWeight.Bold else FontWeight.Normal,
                    )
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        if (showPast) {
            if (session.pastBookings.isEmpty()) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(top = 40.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(Icons.Filled.CalendarMonth, null, modifier = Modifier.size(48.dp), tint = MaterialTheme.hstaff.mutedFg)
                    Spacer(Modifier.height(16.dp))
                    Text("Nothing here just yet", style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
                    SubtleText("Your completed services will appear here.")
                }
            } else {
                session.pastBookings.forEach { booking ->
                    val pro = professionalFor(booking.professionalId)
                    BookingListCard(
                        serviceName = booking.service,
                        proName = pro.name,
                        status = booking.status.label(),
                        amount = formatInr(priceFor(pro.ratePerHour, booking.hours).total),
                        onClick = {
                            viewModel.transitionBooking(BookingStatus.CLOSED)
                            onBookingClicked()
                        },
                    )
                    Spacer(Modifier.height(12.dp))
                }
            }
        } else {
            val active = session.activeBooking?.takeIf {
                it.status !in listOf(BookingStatus.CLOSED, BookingStatus.CANCELLED)
            }
            if (active == null) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(top = 40.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(Icons.Filled.CalendarMonth, null, modifier = Modifier.size(48.dp), tint = MaterialTheme.hstaff.mutedFg)
                    Spacer(Modifier.height(16.dp))
                    Text("No bookings yet", style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
                    SubtleText("Your next booking will appear here.")
                }
            } else {
                val pro = professionalFor(active.professionalId)
                BookingListCard(
                    serviceName = active.service,
                    proName = pro.name,
                    status = active.status.label(),
                    amount = formatInr(priceFor(pro.ratePerHour, active.hours).total),
                    onClick = onBookingClicked,
                )
            }
        }

        Spacer(Modifier.height(100.dp))
    }
}

@Composable
private fun BookingListCard(
    serviceName: String,
    proName: String,
    status: String,
    amount: String,
    onClick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(MaterialTheme.hstaff.cardBg)
            .border(1.dp, MaterialTheme.hstaff.border, RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
            .padding(20.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(serviceName, style = MaterialTheme.typography.titleSmall)
            StatusChip(label = status)
        }
        Spacer(Modifier.height(4.dp))
        SubtleText(proName)
        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            SubtleText("Total")
            Text(amount, style = MaterialTheme.typography.titleSmall)
        }
    }
}

// ── Profile screen ───────────────────────────────────────────────────────────

@Composable
fun ProfileScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onLogout: () -> Unit,
    onNotifications: () -> Unit,
    onBookings: () -> Unit,
) {
    val session by viewModel.session.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Profile", onBack = onBack)

        // Avatar
        Column(
            modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.hstaff.brandGradient),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = session.name.take(2).uppercase(),
                    style = MaterialTheme.typography.headlineMedium.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                    ),
                )
            }
            Spacer(Modifier.height(12.dp))
            Text(session.name, style = MaterialTheme.typography.headlineMedium)
            if (session.phone.isNotEmpty()) {
                Text(
                    "+91 ${session.phone}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.hstaff.mutedFg,
                )
            }
            if (session.authenticated) {
                Spacer(Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Icon(Icons.Filled.Shield, null, modifier = Modifier.size(14.dp), tint = MaterialTheme.hstaff.success)
                    Text("Mobile Verified", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.hstaff.success)
                }
            }
        }

        // Menu items
        listOf(
            Triple(Icons.Filled.Person, "Personal Information") { },
            Triple(Icons.Filled.CalendarMonth, "Bookings", onBookings),
            Triple(Icons.Filled.Bell, "Notifications", onNotifications),
            Triple(Icons.Filled.Shield, "Help & Safety") { },
        ).forEach { (icon, label, action) ->
            ProfileMenuItem(icon = { Icon(icon, null, modifier = Modifier.size(20.dp), tint = MaterialTheme.hstaff.mutedFg) }, label = label, onClick = action)
            Spacer(Modifier.height(2.dp))
        }

        Spacer(Modifier.height(16.dp))

        // Logout
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(MaterialTheme.colorScheme.error.copy(alpha = 0.08f))
                .clickable(onClick = onLogout)
                .padding(16.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                "Log out",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.error,
            )
        }

        Spacer(Modifier.height(24.dp))
        Text(
            "H-Staff · Made for everyday life",
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.hstaff.mutedFg,
        )
        Spacer(Modifier.height(100.dp))
    }
}

@Composable
private fun ProfileMenuItem(
    icon: @Composable () -> Unit,
    label: String,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(MaterialTheme.hstaff.cardBg)
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        icon()
        Text(label, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
        Text("›", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.hstaff.mutedFg)
    }
}

// ── Notifications screen ─────────────────────────────────────────────────────

@Composable
fun NotificationsScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
) {
    val session by viewModel.session.collectAsState()
    val booking = session.activeBooking

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Notifications", onBack = onBack)
        Text("You're in the loop.", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(20.dp))

        if (booking == null) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(top = 40.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Icon(Icons.Filled.Bell, null, modifier = Modifier.size(48.dp), tint = MaterialTheme.hstaff.mutedFg)
                Spacer(Modifier.height(16.dp))
                Text("All quiet for now", style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
                SubtleText("Booking, payment and safety updates will appear here.")
            }
        } else {
            val pro = professionalFor(booking.professionalId)

            Text("Booking updates", style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.height(12.dp))

            listOf(
                Triple(Icons.Filled.CheckCircle, "Your request to ${pro.name} was sent.", "Just now"),
                Triple(Icons.Filled.Check, "${pro.name} confirmed your booking.", "Booking"),
                Triple(Icons.Filled.Shield, "Your service uses arrival and completion codes.", "Safety"),
            ).forEachIndexed { index, (icon, text, time) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (index == 0) MaterialTheme.hstaff.softPink else MaterialTheme.hstaff.cardBg)
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(if (index == 0) MaterialTheme.hstaff.peach else MaterialTheme.hstaff.mutedBg),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(icon, null, modifier = Modifier.size(18.dp), tint = MaterialTheme.hstaff.coral)
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text, style = MaterialTheme.typography.bodyMedium)
                        Text(time, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.hstaff.mutedFg)
                    }
                }
                Spacer(Modifier.height(10.dp))
            }
        }

        Spacer(Modifier.height(100.dp))
    }
}
