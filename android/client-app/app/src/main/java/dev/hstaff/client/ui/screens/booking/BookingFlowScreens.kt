package dev.hstaff.client.ui.screens.booking

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
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.DatePicker
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import dev.hstaff.client.domain.model.BookingMode
import dev.hstaff.client.ui.ClientViewModel
import dev.hstaff.client.ui.components.BookingProgressBar
import dev.hstaff.client.ui.components.ChoiceCard
import dev.hstaff.client.ui.components.GradientButton
import dev.hstaff.client.ui.components.ScreenTopBar
import dev.hstaff.client.ui.components.SubtleText
import dev.hstaff.client.ui.theme.hstaff

// ── Step 1: Mode selection (Instant / Scheduled) ──────────────────────────────

@Composable
fun ModeScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onContinue: () -> Unit,
) {
    val draft by viewModel.draft.collectAsState()
    var error by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = draft.service, onBack = onBack)
        BookingProgressBar(step = 1)
        Spacer(Modifier.height(8.dp))

        Text("Your day. Your timing.", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(6.dp))
        SubtleText("How do you want to book?")

        Spacer(Modifier.height(20.dp))

        ChoiceCard(
            title = "Instant",
            detail = "Need someone soon? Usually within ~30 minutes.",
            selected = draft.mode == BookingMode.INSTANT,
            onClick = { viewModel.updateDraft { it.copy(mode = BookingMode.INSTANT) } },
            leadingContent = {
                Icon(Icons.Filled.Bolt, contentDescription = null, modifier = Modifier.size(20.dp))
            },
        )
        Spacer(Modifier.height(12.dp))
        ChoiceCard(
            title = "Scheduled",
            detail = "Plan ahead. Choose a date and time.",
            selected = draft.mode == BookingMode.SCHEDULED,
            onClick = { viewModel.updateDraft { it.copy(mode = BookingMode.SCHEDULED) } },
            leadingContent = {
                Icon(Icons.Filled.CalendarMonth, contentDescription = null, modifier = Modifier.size(20.dp))
            },
        )

        if (draft.mode == BookingMode.SCHEDULED) {
            Spacer(Modifier.height(20.dp))
            Text("Choose a date and time", style = MaterialTheme.typography.labelMedium)
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                OutlinedTextField(
                    value = draft.date,
                    onValueChange = { viewModel.updateDraft { d -> d.copy(date = it) } },
                    label = { Text("Date (YYYY-MM-DD)") },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    shape = RoundedCornerShape(15.dp),
                )
                OutlinedTextField(
                    value = draft.time,
                    onValueChange = { viewModel.updateDraft { d -> d.copy(time = it) } },
                    label = { Text("Time (HH:MM)") },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    shape = RoundedCornerShape(15.dp),
                )
            }
        }

        if (error.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }

        Spacer(Modifier.height(24.dp))

        GradientButton(text = "Continue →", onClick = {
            if (draft.mode == BookingMode.SCHEDULED && (draft.date.isEmpty() || draft.time.isEmpty())) {
                error = "Choose your preferred date and time."
            } else {
                error = ""
                onContinue()
            }
        })
    }
}

// ── Step 2: Requirements (task type + duration) ───────────────────────────────

@Composable
fun RequirementsScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onContinue: () -> Unit,
) {
    val draft by viewModel.draft.collectAsState()

    val taskOptions = if (draft.service == "Cleaning") {
        listOf("Regular Cleaning", "Deep Cleaning", "Kitchen", "Bathroom")
    } else {
        listOf("${draft.service} service", "Repair & maintenance", "Inspection & advice")
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = draft.service, onBack = onBack)
        BookingProgressBar(step = 2)
        Spacer(Modifier.height(8.dp))

        Text("A little more about the job.", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(6.dp))
        SubtleText("Tell us what you need. We'll find the right people.")

        Spacer(Modifier.height(20.dp))

        Text("What do you need help with?", style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(8.dp))

        taskOptions.forEach { task ->
            ChoiceCard(
                title = task,
                selected = draft.task == task,
                onClick = { viewModel.updateDraft { it.copy(task = task) } },
            )
            Spacer(Modifier.height(10.dp))
        }

        Spacer(Modifier.height(8.dp))
        Text("How long do you need help?", style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(8.dp))

        // Duration stepper
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(MaterialTheme.hstaff.cardBg)
                .border(1.dp, MaterialTheme.hstaff.border, RoundedCornerShape(18.dp))
                .padding(8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(
                onClick = { if (draft.hours > 1) viewModel.updateDraft { it.copy(hours = it.hours - 1) } },
                enabled = draft.hours > 1,
            ) {
                Icon(Icons.Filled.Remove, contentDescription = "Decrease duration")
            }
            Text(
                text = "${draft.hours} ${if (draft.hours == 1) "hour" else "hours"}",
                style = MaterialTheme.typography.titleSmall,
            )
            IconButton(
                onClick = { if (draft.hours < 8) viewModel.updateDraft { it.copy(hours = it.hours + 1) } },
                enabled = draft.hours < 8,
            ) {
                Icon(Icons.Filled.Add, contentDescription = "Increase duration")
            }
        }

        Spacer(Modifier.height(24.dp))
        GradientButton(text = "Continue →", onClick = onContinue)
    }
}

// ── Step 2b: Materials + notes ────────────────────────────────────────────────

@Composable
fun MaterialsScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onContinue: () -> Unit,
) {
    val draft by viewModel.draft.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Job requirements", onBack = onBack)
        BookingProgressBar(step = 2)
        Spacer(Modifier.height(8.dp))

        Text("Ready for a great start.", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(6.dp))
        SubtleText("A few details help your professional prepare.")

        Spacer(Modifier.height(20.dp))

        Text("Who provides the materials?", style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(8.dp))

        listOf("I'll provide them", "Professional should bring tools").forEach { option ->
            ChoiceCard(
                title = option,
                selected = draft.materials == option,
                onClick = { viewModel.updateDraft { it.copy(materials = option) } },
            )
            Spacer(Modifier.height(10.dp))
        }

        Spacer(Modifier.height(8.dp))
        Text("Anything they should know?", style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(4.dp))
        Text("Optional", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.hstaff.mutedFg)
        Spacer(Modifier.height(8.dp))

        OutlinedTextField(
            value = draft.notes,
            onValueChange = { viewModel.updateDraft { d -> d.copy(notes = it) } },
            modifier = Modifier.fillMaxWidth(),
            placeholder = {
                Text(
                    "Tell us about your space, pets, or any special instructions…",
                    color = MaterialTheme.hstaff.mutedFg,
                )
            },
            minLines = 4,
            shape = RoundedCornerShape(15.dp),
        )

        Spacer(Modifier.height(24.dp))
        GradientButton(text = "Choose location →", onClick = onContinue)
    }
}

// ── Step 3: Location ──────────────────────────────────────────────────────────

@Composable
fun LocationScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onContinue: () -> Unit,
) {
    val draft by viewModel.draft.collectAsState()
    val session by viewModel.session.collectAsState()

    val savedAddresses = listOf(
        "Home · 24, Green Park, Baner, ${session.city}",
        "Office · 12, Business Square, ${session.city}",
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Service location", onBack = onBack)
        BookingProgressBar(step = 3)
        Spacer(Modifier.height(8.dp))

        Text("Where can we help?", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(6.dp))
        SubtleText("Choose where your professional should arrive.")

        Spacer(Modifier.height(20.dp))

        // Map mockup
        MapMockup(address = draft.address)

        Spacer(Modifier.height(16.dp))

        savedAddresses.forEach { address ->
            val label = address.split(" · ").firstOrNull() ?: "Address"
            val detail = address.substringAfter(" · ")
            ChoiceCard(
                title = label,
                detail = detail,
                selected = draft.address == address,
                onClick = { viewModel.updateDraft { it.copy(address = address) } },
                leadingContent = {
                    Icon(Icons.Filled.LocationOn, contentDescription = null, modifier = Modifier.size(20.dp))
                },
            )
            Spacer(Modifier.height(10.dp))
        }

        // Verified service availability
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(
                imageVector = Icons.Filled.LocationOn,
                contentDescription = null,
                modifier = Modifier.size(13.dp),
                tint = MaterialTheme.hstaff.success,
            )
            Text(
                text = "H-Staff services are available here",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.hstaff.success,
            )
        }

        Spacer(Modifier.height(24.dp))
        GradientButton(text = "Find professionals →", onClick = onContinue)
    }
}

// ── OSM map mockup (SVG-equivalent drawn with Canvas) ────────────────────────

@Composable
private fun MapMockup(address: String, tracking: Boolean = false) {
    // SVG-to-Canvas translation of the web MapMockup component
    // Shows a schematic street map with road lines, park blocks, and a location pin.
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(220.dp)
            .clip(RoundedCornerShape(22.dp))
            .background(MaterialTheme.hstaff.mutedBg)
            .border(1.dp, MaterialTheme.hstaff.border, RoundedCornerShape(22.dp)),
        contentAlignment = Alignment.BottomStart,
    ) {
        // Canvas drawing done inside the Box
        androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height

            // Park blocks
            drawRoundRect(
                color = Color(0xFFD2F5E6),
                topLeft = androidx.compose.ui.geometry.Offset(w * 0.04f, h * 0.07f),
                size = androidx.compose.ui.geometry.Size(w * 0.26f, h * 0.23f),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(40f),
            )
            drawRoundRect(
                color = Color(0xFFD2F5E6),
                topLeft = androidx.compose.ui.geometry.Offset(w * 0.64f, h * 0.70f),
                size = androidx.compose.ui.geometry.Size(w * 0.29f, h * 0.21f),
                cornerRadius = androidx.compose.ui.geometry.CornerRadius(40f),
            )

            // Road lines
            val roadColor = Color(0xFFE8E2DB)
            val roadStroke = androidx.compose.ui.graphics.drawscope.Stroke(width = 38f)
            drawLine(Color.White, androidx.compose.ui.geometry.Offset(0f, h * 0.39f), androidx.compose.ui.geometry.Offset(w, h * 0.39f), strokeWidth = 50f)
            drawLine(Color.White, androidx.compose.ui.geometry.Offset(w * 0.33f, 0f), androidx.compose.ui.geometry.Offset(w * 0.33f, h), strokeWidth = 50f)
            drawLine(roadColor, androidx.compose.ui.geometry.Offset(0f, h * 0.39f), androidx.compose.ui.geometry.Offset(w, h * 0.39f), strokeWidth = 2f)
            drawLine(roadColor, androidx.compose.ui.geometry.Offset(w * 0.33f, 0f), androidx.compose.ui.geometry.Offset(w * 0.33f, h), strokeWidth = 2f)

            // Location pin (you)
            drawCircle(
                color = Color(0xFFE96B9A),
                radius = 20f,
                center = androidx.compose.ui.geometry.Offset(w * 0.57f, h * 0.26f),
            )
            drawCircle(
                color = Color.White,
                radius = 7f,
                center = androidx.compose.ui.geometry.Offset(w * 0.57f, h * 0.26f),
            )
        }

        // Caption
        Box(
            modifier = Modifier
                .padding(14.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Color.White.copy(alpha = 0.88f))
                .padding(horizontal = 10.dp, vertical = 6.dp),
        ) {
            Text(
                text = if (tracking) "Arriving in 14 min" else address.take(40),
                style = MaterialTheme.typography.labelSmall,
                maxLines = 1,
            )
        }
    }
}
