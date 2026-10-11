package dev.hstaff.client.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import dev.hstaff.client.domain.model.PriceBreakdown
import dev.hstaff.client.domain.model.Professional
import dev.hstaff.client.domain.model.formatInr
import dev.hstaff.client.domain.model.priceFor
import dev.hstaff.client.ui.theme.hstaff

// ── Gradient button ──────────────────────────────────────────────────────────

@Composable
fun GradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val gradient = MaterialTheme.hstaff.brandGradient
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .clip(CircleShape)
            .then(
                if (enabled) Modifier.background(gradient)
                else Modifier.background(MaterialTheme.hstaff.border)
            )
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium.copy(
                fontWeight = FontWeight.SemiBold,
                fontSize = 15.sp,
                color = if (enabled) Color.White else MaterialTheme.hstaff.mutedFg,
            ),
        )
    }
}

// ── Outlined/ghost button ─────────────────────────────────────────────────────

@Composable
fun OutlinedHStaffButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .clip(CircleShape)
            .border(1.dp, MaterialTheme.hstaff.border, CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium.copy(
                fontWeight = FontWeight.SemiBold,
                fontSize = 15.sp,
            ),
        )
    }
}

// ── Screen top bar ────────────────────────────────────────────────────────────

@Composable
fun ScreenTopBar(
    title: String,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onBack) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Go back",
            )
        }
        Text(
            text = title,
            modifier = Modifier.weight(1f),
            textAlign = TextAlign.Center,
            style = MaterialTheme.typography.titleMedium,
        )
        Spacer(Modifier.size(48.dp)) // mirror back button for centering
    }
}

// ── Section heading ───────────────────────────────────────────────────────────

@Composable
fun SectionHeading(
    title: String,
    action: String? = null,
    onAction: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium,
        )
        if (action != null && onAction != null) {
            Row(
                modifier = Modifier.clickable(onClick = onAction),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = action,
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.hstaff.mutedFg,
                )
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    modifier = Modifier.size(13.dp),
                    tint = MaterialTheme.hstaff.mutedFg,
                )
            }
        }
    }
}

// ── Eyebrow label ─────────────────────────────────────────────────────────────

@Composable
fun Eyebrow(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text.uppercase(),
        modifier = modifier,
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.hstaff.mutedFg,
        letterSpacing = 0.8.sp,
    )
}

// ── Subtle text ───────────────────────────────────────────────────────────────

@Composable
fun SubtleText(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        modifier = modifier,
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.hstaff.mutedFg,
    )
}

// ── Verification badge ────────────────────────────────────────────────────────

@Composable
fun VerificationBadge(modifier: Modifier = Modifier) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Icon(
            imageVector = Icons.Filled.Shield,
            contentDescription = null,
            modifier = Modifier.size(12.dp),
            tint = MaterialTheme.hstaff.success,
        )
        Text(
            text = "Identity Verified",
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.hstaff.success,
            ),
        )
    }
}

// ── Choice row (radio-like selection card) ────────────────────────────────────

@Composable
fun ChoiceCard(
    title: String,
    detail: String? = null,
    selected: Boolean = false,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    leadingContent: (@Composable () -> Unit)? = null,
) {
    val gradient = MaterialTheme.hstaff.brandGradient
    val border = if (selected) {
        Modifier.drawBehind {
            // gradient border trick
        }.border(2.dp, MaterialTheme.hstaff.coral, RoundedCornerShape(18.dp))
    } else {
        Modifier.border(1.dp, MaterialTheme.hstaff.border, RoundedCornerShape(18.dp))
    }

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(MaterialTheme.hstaff.cardBg)
            .then(border)
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (leadingContent != null) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(13.dp))
                    .background(MaterialTheme.hstaff.mutedBg),
                contentAlignment = Alignment.Center,
            ) {
                leadingContent()
            }
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, style = MaterialTheme.typography.titleSmall)
            if (detail != null) {
                Spacer(Modifier.height(3.dp))
                SubtleText(text = detail)
            }
        }
        if (selected) {
            Icon(
                imageVector = Icons.Filled.Check,
                contentDescription = "Selected",
                tint = MaterialTheme.hstaff.success,
                modifier = Modifier.size(20.dp),
            )
        }
    }
}

// ── Professional card ─────────────────────────────────────────────────────────

@Composable
fun ProfessionalCard(
    professional: Professional,
    service: String? = null,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
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
            AsyncImage(
                model = professional.imageUrl,
                contentDescription = professional.name,
                modifier = Modifier
                    .size(width = 75.dp, height = 91.dp)
                    .clip(RoundedCornerShape(16.dp)),
                contentScale = ContentScale.Crop,
            )
            Column {
                Text(
                    text = professional.name,
                    style = MaterialTheme.typography.titleSmall,
                )
                Spacer(Modifier.height(4.dp))
                VerificationBadge()
                Spacer(Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(
                        imageVector = Icons.Filled.Star,
                        contentDescription = null,
                        modifier = Modifier.size(12.dp),
                    )
                    Text(
                        text = "${professional.rating}",
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    )
                    Text("•", color = MaterialTheme.hstaff.mutedFg, fontSize = 11.sp)
                    Text(
                        text = "${professional.jobs} jobs",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.hstaff.mutedFg,
                    )
                }
                SubtleText("${professional.years} yrs · ${professional.distanceKm} km away")
            }
        }
        Spacer(Modifier.height(12.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(MaterialTheme.hstaff.border),
        )
        Spacer(Modifier.height(11.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    text = formatInr(professional.ratePerHour),
                    style = MaterialTheme.typography.titleSmall,
                )
                if (service != null) {
                    SubtleText(service)
                }
                SubtleText("/hr")
            }
            Row(
                modifier = Modifier.clickable(onClick = onClick),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "View profile",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.hstaff.mutedFg,
                )
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    modifier = Modifier.size(13.dp),
                )
            }
        }
    }
}

// ── Price breakdown card ──────────────────────────────────────────────────────

@Composable
fun PriceBreakdownCard(rate: Int, hours: Int, modifier: Modifier = Modifier) {
    val p = priceFor(rate, hours)
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .border(1.dp, MaterialTheme.hstaff.border, RoundedCornerShape(22.dp))
            .background(MaterialTheme.hstaff.cardBg)
            .padding(20.dp),
    ) {
        DetailRow(label = "Professional charge", value = formatInr(p.charge))
        SubtleText("$hours ${if (hours == 1) "hour" else "hours"} × ${formatInr(rate)}/hr")
        Spacer(Modifier.height(4.dp))
        DetailRow(label = "H-Staff service fee", value = formatInr(p.fee))
        Spacer(Modifier.height(4.dp))
        Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(MaterialTheme.hstaff.border))
        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(text = "Total", style = MaterialTheme.typography.titleMedium)
            Text(
                text = formatInr(p.total),
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            )
        }
    }
}

// ── Detail row (label + value) ────────────────────────────────────────────────

@Composable
fun DetailRow(label: String, value: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.fillMaxWidth().padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        SubtleText(label)
        Text(text = value, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
    }
}

// ── OTP display box (shows code as individual digit cards) ────────────────────

@Composable
fun OtpDisplay(code: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        code.forEach { digit ->
            Box(
                modifier = Modifier
                    .padding(horizontal = 4.dp)
                    .size(width = 41.dp, height = 54.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.hstaff.mutedBg),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = digit.toString(),
                    style = MaterialTheme.typography.headlineLarge.copy(fontSize = 23.sp),
                )
            }
        }
    }
}

// ── Status chip ───────────────────────────────────────────────────────────────

@Composable
fun StatusChip(label: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .clip(CircleShape)
            .background(MaterialTheme.hstaff.successSoft)
            .padding(horizontal = 10.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(5.dp),
    ) {
        Icon(
            imageVector = Icons.Filled.Check,
            contentDescription = null,
            modifier = Modifier.size(12.dp),
            tint = MaterialTheme.hstaff.success,
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(color = MaterialTheme.hstaff.success),
        )
    }
}

// ── Empty state ───────────────────────────────────────────────────────────────

@Composable
fun EmptyState(
    icon: @Composable () -> Unit,
    title: String,
    description: String,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 45.dp, horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        icon()
        Spacer(Modifier.height(18.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.headlineMedium,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(8.dp))
        SubtleText(text = description)
        if (actionLabel != null && onAction != null) {
            Spacer(Modifier.height(20.dp))
            GradientButton(text = actionLabel, onClick = onAction)
        }
    }
}

// ── Gradient state symbol (circle with icon) ──────────────────────────────────

@Composable
fun StateSymbol(
    content: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    animated: Boolean = false,
) {
    val alpha by if (animated) {
        rememberInfiniteTransition(label = "pulse").animateFloat(
            initialValue = 1f,
            targetValue = 0.5f,
            animationSpec = infiniteRepeatable(
                animation = tween(1000, easing = LinearEasing),
                repeatMode = RepeatMode.Reverse,
            ),
            label = "alpha",
        )
    } else {
        androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(1f) }
    }

    Box(
        modifier = modifier
            .size(82.dp)
            .graphicsLayer { this.alpha = alpha }
            .clip(CircleShape)
            .background(MaterialTheme.hstaff.brandGradient),
        contentAlignment = Alignment.Center,
    ) {
        content()
    }
}

// ── Skeleton loading placeholder ──────────────────────────────────────────────

@Composable
fun SkeletonCard(modifier: Modifier = Modifier) {
    val alpha by rememberInfiniteTransition(label = "skeleton").animateFloat(
        initialValue = 1f,
        targetValue = 0.4f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "alpha",
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(116.dp)
            .graphicsLayer { this.alpha = alpha }
            .clip(RoundedCornerShape(22.dp))
            .background(MaterialTheme.hstaff.mutedBg),
    )
}

// ── Progress dots (booking flow 1-5) ─────────────────────────────────────────

@Composable
fun BookingProgressBar(step: Int, total: Int = 5, modifier: Modifier = Modifier) {
    val gradient = MaterialTheme.hstaff.brandGradient
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(5.dp),
    ) {
        repeat(total) { index ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(3.dp)
                    .clip(CircleShape)
                    .then(
                        if (index < step) Modifier.background(gradient)
                        else Modifier.background(MaterialTheme.hstaff.border)
                    ),
            )
        }
    }
}

// ── Menu row (profile menu) ───────────────────────────────────────────────────

@Composable
fun MenuRow(
    icon: @Composable () -> Unit,
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(modifier = Modifier.size(24.dp)) { icon() }
        Text(
            text = title,
            modifier = Modifier.weight(1f),
            style = MaterialTheme.typography.bodyMedium,
        )
        Icon(
            imageVector = Icons.Filled.ChevronRight,
            contentDescription = null,
            modifier = Modifier.size(15.dp),
            tint = MaterialTheme.hstaff.mutedFg,
        )
    }
}
