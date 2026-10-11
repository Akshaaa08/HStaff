package dev.hstaff.client.ui.screens.booking

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import dev.hstaff.client.domain.model.sampleProfessionals
import dev.hstaff.client.ui.ClientViewModel
import dev.hstaff.client.ui.components.BookingProgressBar
import dev.hstaff.client.ui.components.GradientButton
import dev.hstaff.client.ui.components.ProfessionalCard
import dev.hstaff.client.ui.components.PriceBreakdownCard
import dev.hstaff.client.ui.components.ScreenTopBar
import dev.hstaff.client.ui.components.SkeletonCard
import dev.hstaff.client.ui.components.SubtleText
import dev.hstaff.client.ui.components.VerificationBadge
import dev.hstaff.client.ui.theme.hstaff
import dev.hstaff.client.domain.model.formatInr
import dev.hstaff.client.domain.model.professionalFor

// ── Step 4: Professionals list ────────────────────────────────────────────────

@Composable
fun ProfessionalsScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onSelectProfessional: (String) -> Unit,
) {
    val draft by viewModel.draft.collectAsState()
    val sortMode by viewModel.sortMode.collectAsState()
    val sorted = viewModel.sortedProfessionals()
    val isLoading = false // replace with actual loading state

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Choose your professional", onBack = onBack)
        BookingProgressBar(step = 4)
        Spacer(Modifier.height(8.dp))

        Text("Good people. Great help.", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(6.dp))
        SubtleText("${sorted.size} verified professionals nearby for ${draft.service.lowercase()}.")

        Spacer(Modifier.height(16.dp))

        // Sort chips
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            listOf("Recommended", "Nearest", "Top Rated", "Price").forEach { mode ->
                val selected = sortMode == mode
                androidx.compose.foundation.layout.Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(
                            if (selected) MaterialTheme.hstaff.peach
                            else MaterialTheme.hstaff.mutedBg
                        )
                        .clickable { viewModel.setSortMode(mode) }
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                ) {
                    Text(
                        text = mode,
                        style = MaterialTheme.typography.labelLarge.copy(
                            color = if (selected) MaterialTheme.colorScheme.onSurface
                            else MaterialTheme.hstaff.mutedFg,
                        ),
                    )
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        if (isLoading) {
            SkeletonCard()
            Spacer(Modifier.height(12.dp))
            SkeletonCard()
        } else {
            sorted.forEach { professional ->
                ProfessionalCard(
                    professional = professional,
                    service = draft.service,
                    onClick = { onSelectProfessional(professional.id) },
                )
                Spacer(Modifier.height(12.dp))
            }
        }

        SubtleText("You choose who comes to your home.")
        Spacer(Modifier.height(100.dp))
    }
}

// ── Professional profile (step 4 detail) ─────────────────────────────────────

@Composable
fun ProfessionalProfileScreen(
    proId: String,
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onRequest: () -> Unit,
) {
    val draft by viewModel.draft.collectAsState()
    val professional = professionalFor(proId)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState()),
    ) {
        ScreenTopBar(
            title = "Meet your professional",
            onBack = onBack,
            modifier = Modifier.padding(horizontal = 8.dp),
        )

        AsyncImage(
            model = professional.imageUrl,
            contentDescription = professional.name,
            modifier = Modifier
                .fillMaxWidth()
                .height(235.dp)
                .clip(androidx.compose.foundation.shape.RoundedCornerShape(25.dp))
                .padding(horizontal = 24.dp),
            contentScale = ContentScale.Crop,
        )

        Column(modifier = Modifier.padding(horizontal = 24.dp)) {
            Spacer(Modifier.height(18.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(professional.name, style = MaterialTheme.typography.displaySmall.copy(fontSize = 26.sp))
                androidx.compose.foundation.layout.Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(MaterialTheme.hstaff.successSoft)
                        .padding(horizontal = 10.dp, vertical = 7.dp),
                ) {
                    Text("Available", style = MaterialTheme.typography.labelSmall.copy(color = MaterialTheme.hstaff.success))
                }
            }

            Spacer(Modifier.height(6.dp))
            VerificationBadge()
            Spacer(Modifier.height(4.dp))
            SubtleText("${draft.service} · ${professional.distanceKm} km away")

            Spacer(Modifier.height(16.dp))

            // Stats strip
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 18.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                StatItem(label = "Rating", value = "${professional.rating} ★")
                StatItem(label = "Jobs completed", value = "${professional.jobs}")
                StatItem(label = "Experience", value = "${professional.years} yrs")
            }

            Spacer(Modifier.height(4.dp))

            Text("A little about me", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(8.dp))
            SubtleText(professional.bio)

            Spacer(Modifier.height(16.dp))
            Text("Skills & experience", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                professional.skills.forEach { skill ->
                    TagChip(skill)
                }
            }

            Spacer(Modifier.height(16.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                SubtleText("On-time arrival")
                Text(professional.onTimePercent, style = MaterialTheme.typography.labelMedium)
            }

            Spacer(Modifier.height(16.dp))
            Text("Equipment & languages", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(8.dp))
            SubtleText(professional.equipment)
            SubtleText("Speaks ${professional.languages}")

            Spacer(Modifier.height(16.dp))
            Text("Kind words from customers", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(8.dp))
            ReviewCard(author = "Meera K.", rating = 5.0, text = ""Punctual, thoughtful and very thorough. Our home felt wonderful afterwards. Would happily book again."")
            Spacer(Modifier.height(8.dp))
            ReviewCard(author = "Amit D.", rating = 4.9, text = ""Really professional and easy to communicate with. A great experience."")

            Spacer(Modifier.height(16.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                SubtleText("Hourly rate")
                Text(
                    text = "${formatInr(professional.ratePerHour)}/hr",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = androidx.compose.ui.text.font.FontWeight.Bold),
                )
            }

            Spacer(Modifier.height(24.dp))

            GradientButton(
                text = "Request ${professional.name.split(" ").first()} →",
                onClick = {
                    viewModel.updateDraft { it.copy(selectedProId = professional.id) }
                    onRequest()
                },
            )

            Spacer(Modifier.height(100.dp))
        }
    }
}

// ── Step 5: Booking summary ───────────────────────────────────────────────────

@Composable
fun SummaryScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onConfirm: () -> Unit,
) {
    val draft by viewModel.draft.collectAsState()
    val professional = professionalFor(draft.selectedProId)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Booking summary", onBack = onBack)
        BookingProgressBar(step = 5)
        Spacer(Modifier.height(8.dp))

        Text("Let's make it happen.", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(6.dp))
        SubtleText("Everything upfront. Just the way it should be.")

        Spacer(Modifier.height(20.dp))

        // Professional summary card
        androidx.compose.foundation.layout.Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(androidx.compose.foundation.shape.RoundedCornerShape(22.dp))
                .background(MaterialTheme.hstaff.cardBg)
                .then(
                    Modifier.androidx.compose.foundation.border(1.dp, MaterialTheme.hstaff.border, androidx.compose.foundation.shape.RoundedCornerShape(22.dp))
                )
                .padding(20.dp),
        ) {
            Column {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(13.dp),
                ) {
                    AsyncImage(
                        model = professional.imageUrl,
                        contentDescription = professional.name,
                        modifier = Modifier
                            .size(width = 75.dp, height = 91.dp)
                            .clip(androidx.compose.foundation.shape.RoundedCornerShape(16.dp)),
                        contentScale = ContentScale.Crop,
                    )
                    Column {
                        Text(professional.name, style = MaterialTheme.typography.titleSmall)
                        VerificationBadge()
                        SubtleText("★ ${professional.rating} · ${professional.jobs} jobs")
                    }
                }

                Spacer(Modifier.height(16.dp))
                DetailRowLocal("Service", draft.service)
                DetailRowLocal("When", if (draft.mode == dev.hstaff.client.domain.model.BookingMode.INSTANT) "Today · As soon as possible" else "${draft.date} · ${draft.time}")
                DetailRowLocal("Duration", "${draft.hours} ${if (draft.hours == 1) "hour" else "hours"}")
                DetailRowLocal("Task", draft.task)

                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Send, contentDescription = null, modifier = Modifier.size(13.dp), tint = MaterialTheme.hstaff.mutedFg)
                    SubtleText("  ${draft.address}")
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        PriceBreakdownCard(rate = professional.ratePerHour, hours = draft.hours)

        Spacer(Modifier.height(16.dp))

        SubtleText("Your professional will confirm the request.\nYou pay after the service is complete.")

        Spacer(Modifier.height(24.dp))

        GradientButton(
            text = "Send service request →",
            onClick = { viewModel.sendRequest(onNavigateToService = onConfirm) },
        )

        Spacer(Modifier.height(100.dp))
    }
}

// ── Local helpers ─────────────────────────────────────────────────────────────

@Composable
private fun StatItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, style = MaterialTheme.typography.headlineMedium.copy(fontSize = 20.sp))
        SubtleText(label)
    }
}

@Composable
private fun TagChip(text: String) {
    androidx.compose.foundation.layout.Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(MaterialTheme.hstaff.mutedBg)
            .padding(horizontal = 12.dp, vertical = 8.dp),
    ) {
        Text(text, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
private fun ReviewCard(author: String, rating: Double, text: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Filled.Star, contentDescription = null, modifier = Modifier.size(12.dp))
            Text(" $author · $rating", style = MaterialTheme.typography.bodySmall.copy(androidx.compose.ui.text.font.FontWeight.SemiBold))
        }
        Spacer(Modifier.height(4.dp))
        SubtleText(text)
    }
}

@Composable
private fun DetailRowLocal(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        SubtleText(label)
        Text(value, style = MaterialTheme.typography.bodyMedium.copy(androidx.compose.ui.text.font.FontWeight.SemiBold))
    }
}
