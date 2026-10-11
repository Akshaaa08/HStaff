package dev.hstaff.client.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Air
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Brush
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.ChevronDown
import androidx.compose.material.icons.filled.Handyman
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Kitchen
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.NotificationsNone
import androidx.compose.material.icons.filled.PedalBike
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warehouse
import androidx.compose.material.icons.filled.Whatshot
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.hstaff.client.domain.model.Booking
import dev.hstaff.client.domain.model.BookingStatus
import dev.hstaff.client.domain.model.ServiceCategory
import dev.hstaff.client.domain.model.ServiceTone
import dev.hstaff.client.domain.model.formatInr
import dev.hstaff.client.domain.model.priceFor
import dev.hstaff.client.domain.model.professionalFor
import dev.hstaff.client.domain.model.sampleProfessionals
import dev.hstaff.client.domain.model.sampleServices
import dev.hstaff.client.ui.ClientViewModel
import dev.hstaff.client.ui.components.GradientButton
import dev.hstaff.client.ui.components.ProfessionalCard
import dev.hstaff.client.ui.components.SectionHeading
import dev.hstaff.client.ui.components.StatusChip
import dev.hstaff.client.ui.components.SubtleText
import dev.hstaff.client.ui.theme.hstaff

@Composable
fun HomeScreen(
    viewModel: ClientViewModel,
    onServiceSelected: (String) -> Unit,
    onBookingClicked: () -> Unit,
    onNotificationsClicked: () -> Unit,
    onProfileClicked: () -> Unit,
    onDiscoverClicked: () -> Unit,
    onProfessionalClicked: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val session by viewModel.session.collectAsState()
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(scrollState),
    ) {
        // App header
        AppHeader(
            name = session.name,
            apiConnected = session.apiConnected,
            onNotifications = onNotificationsClicked,
            onProfile = onProfileClicked,
        )

        Column(modifier = Modifier.padding(horizontal = 24.dp)) {
            // Location chip
            Row(
                modifier = Modifier
                    .clickable { /* open city picker sheet */ }
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(7.dp),
            ) {
                Icon(
                    imageVector = Icons.Filled.Home,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = MaterialTheme.hstaff.mutedFg,
                )
                Text(
                    text = "Home · ",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.hstaff.mutedFg,
                )
                Text(
                    text = "Baner, ${session.city}",
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                )
                Icon(
                    imageVector = Icons.Filled.ChevronDown,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = MaterialTheme.hstaff.mutedFg,
                )
            }

            Spacer(Modifier.height(16.dp))

            // Hero section
            Text(
                text = "Help when you need it",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.hstaff.mutedFg,
                letterSpacing = 0.8.sp,
            )
            Spacer(Modifier.height(6.dp))
            Text(
                text = "Who do you need\ntoday?",
                style = MaterialTheme.typography.displaySmall,
            )
            Spacer(Modifier.height(8.dp))
            SubtleText("Trusted people. Everyday tasks.\nA little help makes a big difference.")

            Spacer(Modifier.height(20.dp))

            // Search bar (tappable — opens Discover)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, MaterialTheme.hstaff.border, CircleShape)
                    .clickable(onClick = onDiscoverClicked)
                    .padding(horizontal = 18.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(11.dp),
            ) {
                Icon(
                    imageVector = Icons.Filled.Build,
                    contentDescription = null,
                    modifier = Modifier.size(19.dp),
                    tint = MaterialTheme.hstaff.mutedFg,
                )
                Text(
                    text = "Search for a service",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.hstaff.mutedFg,
                )
            }

            // Active booking card
            val activeBooking = session.activeBooking
            if (activeBooking != null && activeBooking.status !in listOf(BookingStatus.CLOSED, BookingStatus.CANCELLED)) {
                Spacer(Modifier.height(4.dp))
                SectionHeading(title = "Your active service")
                ActiveBookingCard(booking = activeBooking, onClick = onBookingClicked)
            }

            Spacer(Modifier.height(4.dp))

            // Instant banner
            InstantBanner(onClick = onDiscoverClicked)

            // Popular services
            SectionHeading(
                title = "Popular services",
                action = "View all",
                onAction = onDiscoverClicked,
            )
            ServicesGrid(
                services = sampleServices.take(6),
                onServiceSelected = onServiceSelected,
            )

            // Nearby workers
            SectionHeading(
                title = "Good people, nearby",
                action = "See all",
                onAction = { onProfessionalClicked("sunita") },
            )
            ProfessionalCard(
                professional = sampleProfessionals.first(),
                service = "Cleaning specialist",
                onClick = { onProfessionalClicked("sunita") },
            )

            Spacer(Modifier.height(12.dp))

            // Trust footer
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = Icons.Filled.Shield,
                    contentDescription = null,
                    modifier = Modifier.size(14.dp),
                    tint = MaterialTheme.hstaff.mutedFg,
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    text = "Verified people. Transparent prices. Peace of mind.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.hstaff.mutedFg,
                )
            }

            Spacer(Modifier.height(100.dp)) // dock clearance
        }
    }
}

// ── App header ─────────────────────────────────────────────────────────────────

@Composable
private fun AppHeader(
    name: String,
    apiConnected: Boolean,
    onNotifications: () -> Unit,
    onProfile: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            // Logo text
            Text(
                text = "H-Staff",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 20.sp,
                ),
            )
            // API connection pill
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(
                        if (apiConnected) MaterialTheme.hstaff.successSoft
                        else MaterialTheme.hstaff.mutedBg
                    )
                    .padding(horizontal = 8.dp, vertical = 3.dp),
            ) {
                Text(
                    text = if (apiConnected) "API Live" else "Standalone",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (apiConnected) MaterialTheme.hstaff.success else MaterialTheme.hstaff.mutedFg,
                )
            }
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            // Notifications
            Box {
                IconButton(onClick = onNotifications) {
                    Icon(
                        imageVector = Icons.Filled.NotificationsNone,
                        contentDescription = "Notifications",
                    )
                }
                // Notification dot
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.hstaff.hstaffPink)
                        .align(Alignment.TopEnd)
                        .padding(end = 12.dp, top = 12.dp),
                )
            }
            // Avatar
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.hstaff.peach)
                    .clickable(onClick = onProfile),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = name.take(2).uppercase(),
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                    ),
                )
            }
        }
    }
}

// ── Active booking card ───────────────────────────────────────────────────────

@Composable
private fun ActiveBookingCard(booking: Booking, onClick: () -> Unit) {
    val professional = professionalFor(booking.professionalId)
    val price = priceFor(professional.ratePerHour, booking.hours)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(MaterialTheme.hstaff.cardBg)
            .border(1.dp, MaterialTheme.hstaff.border, RoundedCornerShape(22.dp))
            .clickable(onClick = onClick)
            .padding(14.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(13.dp),
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = booking.service,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.hstaff.mutedFg,
                )
                Text(text = professional.name, style = MaterialTheme.typography.titleSmall)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(
                        text = if (booking.mode.name == "INSTANT") "Today" else booking.date,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.hstaff.mutedFg,
                    )
                    Text("·", color = MaterialTheme.hstaff.mutedFg)
                    Text(
                        text = if (booking.mode.name == "INSTANT") "Instant" else booking.time,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.hstaff.mutedFg,
                    )
                }
                Spacer(Modifier.height(4.dp))
                StatusChip(label = booking.status.label())
            }
        }
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = formatInr(price.total),
                style = MaterialTheme.typography.titleSmall,
            )
            Text(
                text = "View booking →",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.hstaff.mutedFg,
            )
        }
    }
}

// ── Instant banner ────────────────────────────────────────────────────────────

@Composable
private fun InstantBanner(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(MaterialTheme.hstaff.brandGradient)
            .clickable(onClick = onClick)
            .padding(20.dp),
    ) {
        Column(modifier = Modifier.fillMaxWidth(0.6f)) {
            Text(
                text = "A HELPING HAND, RIGHT NOW",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onPrimary,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = "Life happens.\nWe're here to help.",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                ),
            )
            Spacer(Modifier.height(12.dp))
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.2f))
                    .padding(horizontal = 16.dp, vertical = 10.dp),
            ) {
                Text(
                    text = "Get help now ↗",
                    style = MaterialTheme.typography.labelMedium.copy(color = Color.White),
                )
            }
        }
    }
    Spacer(Modifier.height(8.dp))
}

// ── Services grid ─────────────────────────────────────────────────────────────

@Composable
fun ServicesGrid(
    services: List<ServiceCategory>,
    onServiceSelected: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    // Using a fixed 3-column grid (non-lazy since it's embedded in a scrollable column)
    val rows = services.chunked(3)
    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(14.dp)) {
        rows.forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(9.dp),
            ) {
                row.forEach { service ->
                    ServiceTile(
                        service = service,
                        modifier = Modifier.weight(1f),
                        onClick = { onServiceSelected(service.name) },
                    )
                }
                // Fill empty slots in last row
                repeat(3 - row.size) {
                    Spacer(Modifier.weight(1f))
                }
            }
        }
    }
    Spacer(Modifier.height(8.dp))
}

@Composable
private fun ServiceTile(
    service: ServiceCategory,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val bgColor = when (service.tone) {
        ServiceTone.PEACH    -> MaterialTheme.hstaff.peach
        ServiceTone.MINT     -> MaterialTheme.hstaff.mint
        ServiceTone.PINK     -> MaterialTheme.hstaff.softPink
        ServiceTone.LAVENDER -> MaterialTheme.hstaff.lavender
        ServiceTone.YELLOW   -> MaterialTheme.hstaff.yellow
    }
    val icon = serviceIcon(service.name)

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(bgColor),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = service.name,
                modifier = Modifier.size(26.dp),
                tint = MaterialTheme.colorScheme.onSurface,
            )
        }
        Text(
            text = service.name,
            style = MaterialTheme.typography.labelLarge,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
    }
}

private fun serviceIcon(name: String): ImageVector = when (name) {
    "Cleaning"        -> Icons.Filled.Brush
    "Cooking"         -> Icons.Filled.Restaurant
    "Plumbing"        -> Icons.Filled.Build
    "Electrical"      -> Icons.Filled.Bolt
    "Carpentry"       -> Icons.Filled.Handyman
    "General Help"    -> Icons.Filled.Person
    "Service Staff"   -> Icons.Filled.Restaurant
    "Security"        -> Icons.Filled.Security
    "Driver"          -> Icons.Filled.PedalBike
    "Delivery"        -> Icons.Filled.LocalShipping
    "Warehouse"       -> Icons.Filled.Warehouse
    "Painting"        -> Icons.Filled.Brush
    "AC Service"      -> Icons.Filled.Air
    "Appliance Repair"-> Icons.Filled.Kitchen
    "Welding"         -> Icons.Filled.Whatshot
    else              -> Icons.Filled.Build
}
