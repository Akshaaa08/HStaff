package dev.hstaff.client.ui.screens.service

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
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Clock
import androidx.compose.material.icons.filled.LockOutlined
import androidx.compose.material.icons.filled.MessageOutlined
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import dev.hstaff.client.domain.model.BookingStatus
import dev.hstaff.client.domain.model.DemoOtp
import dev.hstaff.client.domain.model.formatInr
import dev.hstaff.client.domain.model.priceFor
import dev.hstaff.client.domain.model.professionalFor
import dev.hstaff.client.domain.model.verifyCode
import dev.hstaff.client.domain.model.visibleOtp
import dev.hstaff.client.ui.ClientViewModel
import dev.hstaff.client.ui.components.DetailRow
import dev.hstaff.client.ui.components.EmptyState
import dev.hstaff.client.ui.components.GradientButton
import dev.hstaff.client.ui.components.OtpDisplay
import dev.hstaff.client.ui.components.OutlinedHStaffButton
import dev.hstaff.client.ui.components.PriceBreakdownCard
import dev.hstaff.client.ui.components.ScreenTopBar
import dev.hstaff.client.ui.components.StateSymbol
import dev.hstaff.client.ui.components.StatusChip
import dev.hstaff.client.ui.components.SubtleText
import dev.hstaff.client.ui.components.VerificationBadge
import dev.hstaff.client.ui.theme.hstaff
import java.util.concurrent.TimeUnit

/**
 * Service status screen — the main booking lifecycle view for customers.
 * Renders different UI depending on booking status (REQUESTED → ACCEPTED →
 * CONFIRMED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED_PENDING_PAYMENT
 * → PAYMENT_PENDING → PAYMENT_COMPLETED → CLOSED / CANCELLED / DISPUTED).
 */
@Composable
fun ServiceStatusScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onNavigateToPayment: () -> Unit,
    onNavigateToDiscover: () -> Unit,
) {
    val session by viewModel.session.collectAsState()
    val elapsedSeconds by viewModel.elapsedSeconds.collectAsState()
    val booking = session.activeBooking

    if (booking == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(24.dp),
        ) {
            ScreenTopBar(title = "Your booking", onBack = onBack)
            EmptyState(
                icon = { Icon(Icons.Filled.CalendarMonth, null, modifier = Modifier.size(40.dp), tint = MaterialTheme.hstaff.mutedFg) },
                title = "No active booking",
                description = "Find the right person for your next task.",
                actionLabel = "Find a service",
                onAction = onNavigateToDiscover,
            )
        }
        return
    }

    val professional = professionalFor(booking.professionalId)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Your booking", onBack = onBack)

        // ── REQUESTED ────────────────────────────────────────────────────────
        when (booking.status) {
            BookingStatus.REQUESTED -> {
                StateSymbol(
                    content = { Icon(Icons.Filled.Send, null, modifier = Modifier.size(33.dp), tint = Color.White) },
                    animated = true,
                )
                Spacer(Modifier.height(16.dp))
                Text("Request sent", style = MaterialTheme.typography.headlineLarge, textAlign = TextAlign.Center)
                SubtleText("Waiting for ${professional.name.split(" ").first()} to respond…")
                Spacer(Modifier.height(8.dp))
                SubtleText("${booking.service} · ${booking.hours} ${if (booking.hours == 1) "hour" else "hours"}")
                Spacer(Modifier.height(20.dp))
                OutlinedHStaffButton(text = "Cancel request", onClick = { viewModel.cancelBooking() })
            }

            // ── CONFIRMED ─────────────────────────────────────────────────
            BookingStatus.ACCEPTED, BookingStatus.CONFIRMED -> {
                StateSymbol(content = { Icon(Icons.Filled.Check, null, modifier = Modifier.size(33.dp), tint = Color.White) })
                Spacer(Modifier.height(16.dp))
                Text("Booking confirmed", style = MaterialTheme.typography.headlineLarge, textAlign = TextAlign.Center)
                SubtleText("${professional.name.split(" ").first()} is getting ready to help.")
            }

            // ── EN_ROUTE / ARRIVED ────────────────────────────────────────
            BookingStatus.EN_ROUTE, BookingStatus.ARRIVED -> {
                val isArrived = booking.status == BookingStatus.ARRIVED
                Text(
                    text = if (isArrived) "Your professional has arrived" else "A little help is on its way",
                    style = MaterialTheme.typography.headlineLarge,
                )
                SubtleText(if (isArrived) "Confirm arrival before sharing your Start Code." else "Arriving in 14 min · ${booking.address}")
                Spacer(Modifier.height(16.dp))
                // Map mockup
                MapMockupService(address = booking.address, tracking = true)
                Spacer(Modifier.height(16.dp))
                if (isArrived) {
                    OtpDisplay(code = DemoOtp.START)
                    SubtleText("Only share this code after your professional has arrived.")
                    Spacer(Modifier.height(16.dp))
                    OtpVerifySection(
                        label = "Enter Start OTP",
                        onVerify = { code ->
                            if (verifyCode(booking.status, code)) {
                                viewModel.transitionBooking(BookingStatus.IN_PROGRESS)
                                true
                            } else false
                        },
                    )
                }
            }

            // ── IN_PROGRESS ───────────────────────────────────────────────
            BookingStatus.IN_PROGRESS -> {
                StateSymbol(content = { Icon(Icons.Filled.Clock, null, modifier = Modifier.size(33.dp), tint = Color.White) })
                Spacer(Modifier.height(12.dp))
                SubtleText("Service in progress")
                Text(professional.name, style = MaterialTheme.typography.headlineLarge)
                SubtleText("${booking.service} · ${formatInr(professional.ratePerHour)}/hr")
                Spacer(Modifier.height(16.dp))
                // Timer
                val h = TimeUnit.SECONDS.toHours(elapsedSeconds)
                val m = TimeUnit.SECONDS.toMinutes(elapsedSeconds) % 60
                val s = elapsedSeconds % 60
                Text(
                    text = "%02d:%02d:%02d".format(h, m, s),
                    style = MaterialTheme.typography.displaySmall.copy(fontSize = 38.sp, fontWeight = FontWeight.Bold),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(8.dp))
                SubtleText("Started at ${booking.startedAt?.let { java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault()).format(it) } ?: "--:--"}")
                Spacer(Modifier.height(20.dp))
                GradientButton(text = "Review completed service →", onClick = { viewModel.transitionBooking(BookingStatus.COMPLETED_PENDING_PAYMENT) })
            }

            // ── COMPLETED_PENDING_PAYMENT ─────────────────────────────────
            BookingStatus.COMPLETED_PENDING_PAYMENT -> {
                StateSymbol(content = { Icon(Icons.Filled.LockOutlined, null, modifier = Modifier.size(33.dp), tint = Color.White) })
                Spacer(Modifier.height(16.dp))
                Text("Complete service", style = MaterialTheme.typography.headlineLarge, textAlign = TextAlign.Center)
                SubtleText("Please verify that the service is complete.")
                Spacer(Modifier.height(12.dp))
                SubtleText("Your completion code")
                Spacer(Modifier.height(8.dp))
                OtpDisplay(code = DemoOtp.END)
                SubtleText("Share this code with your professional only when you're satisfied the work is complete.")
                Spacer(Modifier.height(16.dp))
                OtpVerifySection(
                    label = "Verify completion code",
                    onVerify = { code ->
                        if (verifyCode(booking.status, code)) {
                            viewModel.transitionBooking(BookingStatus.PAYMENT_PENDING)
                            onNavigateToPayment()
                            true
                        } else false
                    },
                )
            }

            // ── PAYMENT_PENDING / FAILED ──────────────────────────────────
            BookingStatus.PAYMENT_PENDING, BookingStatus.FAILED -> {
                Text("Ready for payment", style = MaterialTheme.typography.headlineLarge)
                SubtleText("Your service is complete. Your booking is safe.")
                Spacer(Modifier.height(16.dp))
                PriceBreakdownCard(rate = professional.ratePerHour, hours = booking.hours)
                Spacer(Modifier.height(16.dp))
                GradientButton(text = "Continue to payment →", onClick = onNavigateToPayment)
            }

            // ── CANCELLED ─────────────────────────────────────────────────
            BookingStatus.CANCELLED -> {
                EmptyState(
                    icon = { Icon(Icons.Filled.CalendarMonth, null, modifier = Modifier.size(40.dp), tint = MaterialTheme.hstaff.mutedFg) },
                    title = "Request cancelled",
                    description = "No payment was taken. Find help whenever you need it.",
                    actionLabel = "Find a service",
                    onAction = onNavigateToDiscover,
                )
                return
            }

            // ── DECLINED / EXPIRED ────────────────────────────────────────
            BookingStatus.DECLINED, BookingStatus.EXPIRED -> {
                EmptyState(
                    icon = { Icon(Icons.Filled.Clock, null, modifier = Modifier.size(40.dp), tint = MaterialTheme.hstaff.mutedFg) },
                    title = if (booking.status == BookingStatus.DECLINED) "${professional.name.split(" ").first()} isn't available" else "No response yet",
                    description = "Your request hasn't been accepted. You can choose another professional.",
                    actionLabel = "Find someone else",
                    onAction = {
                        viewModel.transitionBooking(BookingStatus.OPEN)
                        onNavigateToDiscover()
                    },
                )
                return
            }

            // ── CLOSED ────────────────────────────────────────────────────
            BookingStatus.CLOSED -> {
                StateSymbol(content = { Icon(Icons.Filled.Check, null, modifier = Modifier.size(33.dp), tint = Color.White) })
                Spacer(Modifier.height(16.dp))
                Text("All taken care of.", style = MaterialTheme.typography.headlineLarge, textAlign = TextAlign.Center)
                SubtleText("Your service is complete. Thanks for choosing H-Staff.")
            }

            // ── DISPUTED ──────────────────────────────────────────────────
            BookingStatus.DISPUTED -> {
                Text("We're here to help", style = MaterialTheme.typography.headlineLarge)
                SubtleText("Your issue has been recorded. Your service details are safe.")
                Spacer(Modifier.height(20.dp))
                GradientButton(text = "Contact support", onClick = { /* open support */ })
            }

            else -> { /* payment states handled by PaymentScreen */ }
        }

        // ── Professional info card (always visible) ───────────────────────
        if (booking.status !in listOf(
                BookingStatus.CANCELLED, BookingStatus.DECLINED,
                BookingStatus.EXPIRED, BookingStatus.CLOSED,
        )) {
            Spacer(Modifier.height(20.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .background(MaterialTheme.hstaff.cardBg)
                    .border(1.dp, MaterialTheme.hstaff.border, RoundedCornerShape(22.dp))
                    .padding(20.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(13.dp)) {
                    AsyncImage(
                        model = professional.imageUrl,
                        contentDescription = professional.name,
                        modifier = Modifier.size(width = 75.dp, height = 91.dp).clip(RoundedCornerShape(16.dp)),
                        contentScale = ContentScale.Crop,
                    )
                    Column {
                        Text(professional.name, style = MaterialTheme.typography.titleSmall)
                        VerificationBadge()
                        SubtleText("${booking.service} · ${booking.hours} hr")
                        StatusChip(booking.status.label())
                    }
                }
                Spacer(Modifier.height(12.dp))
                DetailRow(label = "Total estimate", value = formatInr(priceFor(professional.ratePerHour, booking.hours).total))
                SubtleText(booking.address)
                SubtleText("Booking ${booking.id}")
            }
        }

        // ── Action buttons based on status ────────────────────────────────
        Spacer(Modifier.height(16.dp))
        when (booking.status) {
            BookingStatus.CONFIRMED -> {
                GradientButton(text = "Track professional →", onClick = { viewModel.transitionBooking(BookingStatus.EN_ROUTE) })
                Spacer(Modifier.height(12.dp))
                OutlinedHStaffButton(text = "Cancel booking", onClick = { viewModel.cancelBooking() })
            }
            BookingStatus.EN_ROUTE -> {
                GradientButton(text = "Confirm professional has arrived ✓", onClick = { viewModel.transitionBooking(BookingStatus.ARRIVED) })
                Spacer(Modifier.height(12.dp))
                OutlinedHStaffButton(text = "Cancel booking", onClick = { viewModel.cancelBooking() })
            }
            else -> { /* other actions handled above in status blocks */ }
        }

        // ── Contact / Details row ─────────────────────────────────────────
        if (booking.status in listOf(
                BookingStatus.CONFIRMED, BookingStatus.EN_ROUTE,
                BookingStatus.ARRIVED, BookingStatus.IN_PROGRESS,
                BookingStatus.COMPLETED_PENDING_PAYMENT,
        )) {
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                OutlinedHStaffButton(
                    text = "Contact",
                    onClick = { /* open chat */ },
                    modifier = Modifier.weight(1f),
                )
                OutlinedHStaffButton(
                    text = "Details",
                    onClick = { /* show booking details */ },
                    modifier = Modifier.weight(1f),
                )
            }
        }

        Spacer(Modifier.height(100.dp))
    }
}

// ── OTP verification inline section ──────────────────────────────────────────

@Composable
private fun OtpVerifySection(
    label: String,
    onVerify: (String) -> Boolean,
) {
    var otp by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    Column {
        Text(label, style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            value = otp,
            onValueChange = { v -> otp = v.filter { it.isDigit() }.take(6); error = "" },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("6-digit code") },
            singleLine = true,
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            shape = RoundedCornerShape(15.dp),
        )
        if (error.isNotEmpty()) {
            Spacer(Modifier.height(4.dp))
            Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }
        Spacer(Modifier.height(12.dp))
        GradientButton(text = "Verify code ✓", onClick = {
            if (!onVerify(otp)) error = "That code doesn't match. Please check all six digits."
        })
    }
}

// ── Map mockup for service screen ─────────────────────────────────────────────

@Composable
private fun MapMockupService(address: String, tracking: Boolean) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(220.dp)
            .clip(RoundedCornerShape(22.dp))
            .background(MaterialTheme.hstaff.mutedBg)
            .border(1.dp, MaterialTheme.hstaff.border, RoundedCornerShape(22.dp)),
        contentAlignment = Alignment.BottomStart,
    ) {
        androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width; val h = size.height
            drawRect(Color(0xFFD2F5E6), topLeft = androidx.compose.ui.geometry.Offset(w * 0.04f, h * 0.07f), size = androidx.compose.ui.geometry.Size(w * 0.26f, h * 0.23f))
            drawLine(Color.White, androidx.compose.ui.geometry.Offset(0f, h * 0.39f), androidx.compose.ui.geometry.Offset(w, h * 0.39f), strokeWidth = 50f)
            drawLine(Color.White, androidx.compose.ui.geometry.Offset(w * 0.33f, 0f), androidx.compose.ui.geometry.Offset(w * 0.33f, h), strokeWidth = 50f)
            // Route line when tracking
            if (tracking) {
                drawLine(Color(0xFFE96B9A), androidx.compose.ui.geometry.Offset(w * 0.2f, h * 0.56f), androidx.compose.ui.geometry.Offset(w * 0.33f, h * 0.39f), strokeWidth = 8f)
                drawLine(Color(0xFFE96B9A), androidx.compose.ui.geometry.Offset(w * 0.33f, h * 0.39f), androidx.compose.ui.geometry.Offset(w * 0.57f, h * 0.26f), strokeWidth = 8f)
                drawCircle(Color(0xFF1F1F2E), radius = 20f, center = androidx.compose.ui.geometry.Offset(w * 0.2f, h * 0.56f))
            }
            drawCircle(Color(0xFFE96B9A), radius = 20f, center = androidx.compose.ui.geometry.Offset(w * 0.57f, h * 0.26f))
            drawCircle(Color.White, radius = 7f, center = androidx.compose.ui.geometry.Offset(w * 0.57f, h * 0.26f))
        }
        Box(
            modifier = Modifier.padding(14.dp).clip(RoundedCornerShape(12.dp)).background(Color.White.copy(alpha = 0.88f)).padding(horizontal = 10.dp, vertical = 6.dp),
        ) {
            Text(
                text = if (tracking) "Arriving in 14 min" else address.take(40),
                style = MaterialTheme.typography.labelSmall,
                maxLines = 1,
            )
        }
    }
}
