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
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.LockOutlined
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import dev.hstaff.client.domain.model.formatInr
import dev.hstaff.client.domain.model.priceFor
import dev.hstaff.client.domain.model.professionalFor
import dev.hstaff.client.ui.ClientViewModel
import dev.hstaff.client.ui.components.ChoiceCard
import dev.hstaff.client.ui.components.GradientButton
import dev.hstaff.client.ui.components.PriceBreakdownCard
import dev.hstaff.client.ui.components.ScreenTopBar
import dev.hstaff.client.ui.components.SubtleText
import dev.hstaff.client.ui.theme.hstaff

@Composable
fun PaymentScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onPaymentSuccess: () -> Unit,
) {
    val session by viewModel.session.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val booking = session.activeBooking
    var selectedMethod by remember { mutableStateOf("UPI") }
    var error by remember { mutableStateOf("") }

    if (booking == null) return

    val professional = professionalFor(booking.professionalId)
    val price = priceFor(professional.ratePerHour, booking.hours)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Payment", onBack = onBack)

        SubtleText("A job well done")
        Spacer(Modifier.height(4.dp))
        Text("The finishing touch.", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(6.dp))
        SubtleText("Pay securely after your service is complete.")

        Spacer(Modifier.height(20.dp))

        // Service summary
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(MaterialTheme.hstaff.cardBg)
                .border(1.dp, MaterialTheme.hstaff.border, RoundedCornerShape(22.dp))
                .padding(20.dp),
        ) {
            Text(booking.service, style = MaterialTheme.typography.titleSmall)
            SubtleText(professional.name)
            SubtleText(booking.id)
        }

        Spacer(Modifier.height(16.dp))
        PriceBreakdownCard(rate = professional.ratePerHour, hours = booking.hours)

        Spacer(Modifier.height(20.dp))
        Text("Payment method", style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(8.dp))

        listOf(
            Triple("UPI", "Instant bank transfer", Icons.Filled.Bolt),
            Triple("Cards", "Credit or debit card", Icons.Filled.CreditCard),
            Triple("Net Banking", "Online banking", Icons.Filled.CreditCard),
        ).forEach { (method, detail, icon) ->
            ChoiceCard(
                title = method,
                detail = detail,
                selected = selectedMethod == method,
                onClick = { selectedMethod = method },
                leadingContent = { Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp)) },
            )
            Spacer(Modifier.height(10.dp))
        }

        if (error.isNotEmpty()) {
            Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(8.dp))
        }

        Spacer(Modifier.height(8.dp))

        if (isLoading) {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MaterialTheme.hstaff.coral)
            }
        } else {
            GradientButton(
                text = "Pay ${formatInr(price.total)} 🔒",
                onClick = {
                    viewModel.simulatePayment(
                        method = selectedMethod,
                        fail = false,
                        onNavigate = onPaymentSuccess,
                    )
                },
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = "Prototype payment · No money will be charged",
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.hstaff.mutedFg,
            )
            Spacer(Modifier.height(8.dp))
            // Simulate failure for testing
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        viewModel.simulatePayment(
                            method = selectedMethod,
                            fail = true,
                            onNavigate = {},
                        )
                        error = "Payment couldn't be completed. Your booking is safe."
                    },
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "Try payment failure",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.hstaff.mutedFg,
                )
            }
        }

        Spacer(Modifier.height(100.dp))
    }
}

// ── Rating screen ─────────────────────────────────────────────────────────────

@Composable
fun RatingScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onSubmitted: () -> Unit,
) {
    val session by viewModel.session.collectAsState()
    val booking = session.activeBooking
    var rating by remember { mutableStateOf(0) }
    var selectedTags by remember { mutableStateOf(setOf<String>()) }
    var reviewText by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }

    if (booking == null) return
    val professional = professionalFor(booking.professionalId)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Your experience", onBack = onBack)

        Box(
            modifier = Modifier
                .size(82.dp)
                .clip(CircleShape)
                .background(MaterialTheme.hstaff.brandGradient)
                .align(Alignment.CenterHorizontally),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Filled.LockOutlined, null, modifier = Modifier.size(33.dp), tint = Color.White)
        }

        Spacer(Modifier.height(12.dp))
        SubtleText("Payment complete")
        Text("How did it go?", style = MaterialTheme.typography.headlineLarge)
        SubtleText("Your feedback helps good professionals grow.")

        Spacer(Modifier.height(20.dp))

        // Star row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
        ) {
            (1..5).forEach { n ->
                val selected = n <= rating
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(CircleShape)
                        .clickable { rating = n },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Filled.CreditCard,
                        contentDescription = "Rate $n stars",
                        modifier = Modifier.size(30.dp),
                        tint = if (selected) MaterialTheme.hstaff.coral else MaterialTheme.hstaff.border,
                    )
                    Text(
                        text = "★",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            color = if (selected) MaterialTheme.hstaff.coral else MaterialTheme.hstaff.border,
                        ),
                    )
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // Tag chips
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
        ) {
            listOf("Punctual", "Professional", "Polite", "Skilled", "Good Quality").forEach { tag ->
                val selected = tag in selectedTags
                Box(
                    modifier = Modifier
                        .padding(4.dp)
                        .clip(CircleShape)
                        .background(if (selected) MaterialTheme.hstaff.peach else MaterialTheme.hstaff.mutedBg)
                        .border(
                            width = if (selected) 2.dp else 0.dp,
                            color = if (selected) MaterialTheme.hstaff.coral else Color.Transparent,
                            shape = CircleShape,
                        )
                        .clickable {
                            selectedTags = if (selected) selectedTags - tag else selectedTags + tag
                        }
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                ) {
                    Text(tag, style = MaterialTheme.typography.labelLarge)
                }
            }
        }

        Spacer(Modifier.height(16.dp))
        Text("Anything else? Optional", style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(8.dp))
        androidx.compose.material3.OutlinedTextField(
            value = reviewText,
            onValueChange = { reviewText = it },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Share a little about your experience…", color = MaterialTheme.hstaff.mutedFg) },
            minLines = 4,
            shape = RoundedCornerShape(15.dp),
        )

        if (error.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }

        Spacer(Modifier.height(24.dp))

        GradientButton(
            text = "Submit review →",
            onClick = {
                if (rating == 0) { error = "Please choose a rating."; return@GradientButton }
                viewModel.submitReview(rating, selectedTags.toList(), reviewText, onSubmitted)
            },
        )

        Spacer(Modifier.height(100.dp))
    }
}

// ── Complete screen ────────────────────────────────────────────────────────────

@Composable
fun CompleteScreen(
    viewModel: ClientViewModel,
    onViewBookings: () -> Unit,
    onHome: () -> Unit,
) {
    val session by viewModel.session.collectAsState()
    val booking = session.pastBookings.firstOrNull() ?: session.activeBooking
    val professional = booking?.let { professionalFor(it.professionalId) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 40.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        StateSymbol(content = {
            Icon(Icons.Filled.LockOutlined, null, modifier = Modifier.size(33.dp), tint = Color.White)
        })
        Spacer(Modifier.height(16.dp))
        SubtleText("One less thing on your list")
        Text("Home feels better.", style = MaterialTheme.typography.headlineLarge, textAlign = TextAlign.Center)
        SubtleText("Your service is complete. Thank you for being part of H-Staff.")

        if (booking != null && professional != null) {
            Spacer(Modifier.height(20.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .background(MaterialTheme.hstaff.cardBg)
                    .border(1.dp, MaterialTheme.hstaff.border, RoundedCornerShape(22.dp))
                    .padding(20.dp),
            ) {
                Text(booking.service, style = MaterialTheme.typography.titleSmall)
                SubtleText(professional.name)
                SubtleText(booking.id)
                Spacer(Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    SubtleText("Amount paid")
                    Text(formatInr(priceFor(professional.ratePerHour, booking.hours).total), style = MaterialTheme.typography.titleSmall)
                }
                booking.rating?.let { r ->
                    SubtleText("Your rating: $r ★")
                }
            }
        }

        Spacer(Modifier.height(24.dp))
        GradientButton(text = "View my bookings", onClick = onViewBookings)
        Spacer(Modifier.height(12.dp))
        Box(
            modifier = Modifier.fillMaxWidth().clickable(onClick = onHome),
            contentAlignment = Alignment.Center,
        ) {
            Text("Back to home", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.hstaff.mutedFg)
        }
    }
}
