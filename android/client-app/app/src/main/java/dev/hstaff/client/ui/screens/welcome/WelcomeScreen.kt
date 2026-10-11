package dev.hstaff.client.ui.screens.welcome

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import dev.hstaff.client.domain.model.sampleProfessionals
import dev.hstaff.client.ui.components.GradientButton
import dev.hstaff.client.ui.components.OutlinedHStaffButton
import dev.hstaff.client.ui.theme.hstaff

/**
 * Welcome / landing screen.
 * Translates the web Landing component with photo collage, badge chips and CTAs.
 */
@Composable
fun WelcomeScreen(
    onGetStarted: () -> Unit,
    onLogin: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
    ) {
        // Header row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            HStaffLogoCompose()
            androidx.compose.material3.TextButton(onClick = onLogin) {
                Text("Log in", style = MaterialTheme.typography.labelMedium)
            }
        }

        Spacer(Modifier.height(16.dp))

        // Verified pill
        Row(
            modifier = Modifier
                .clip(CircleShape)
                .background(MaterialTheme.hstaff.softPink)
                .padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(
                imageVector = Icons.Filled.Shield,
                contentDescription = null,
                modifier = Modifier.size(14.dp),
                tint = MaterialTheme.hstaff.hstaffPink,
            )
            Text(
                text = "Verified help across Maharashtra",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.hstaff.hstaffPink,
            )
        }

        Spacer(Modifier.height(20.dp))

        // Hero headline with gradient accent on "Great help."
        Text(
            text = buildAnnotatedString {
                append("Good people.\n")
                withStyle(SpanStyle(
                    brush = MaterialTheme.hstaff.brandGradient,
                    fontWeight = FontWeight.ExtraBold,
                )) {
                    append("Great help.")
                }
                append("\nRight next door.")
            },
            style = MaterialTheme.typography.displaySmall.copy(
                fontSize = 36.sp,
                lineHeight = 44.sp,
                fontWeight = FontWeight.ExtraBold,
            ),
        )

        Spacer(Modifier.height(12.dp))

        Text(
            text = "Book trusted local professionals in minutes — or earn on your own terms.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.hstaff.mutedFg,
        )

        Spacer(Modifier.height(24.dp))

        // Photo collage + float badges
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp)
                .clip(RoundedCornerShape(28.dp))
                .background(MaterialTheme.hstaff.brandGradient),
        ) {
            Row(
                modifier = Modifier.fillMaxSize(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.Bottom,
            ) {
                AsyncImage(
                    model = sampleProfessionals[0].imageUrl,
                    contentDescription = "Sunita, a verified cleaning professional",
                    modifier = Modifier
                        .size(width = 130.dp, height = 190.dp)
                        .clip(RoundedCornerShape(topStart = 60.dp, topEnd = 60.dp)),
                    contentScale = ContentScale.Crop,
                )
                AsyncImage(
                    model = sampleProfessionals[1].imageUrl,
                    contentDescription = "Rahul, a verified electrician",
                    modifier = Modifier
                        .size(width = 130.dp, height = 168.dp)
                        .clip(RoundedCornerShape(topStart = 60.dp, topEnd = 60.dp)),
                    contentScale = ContentScale.Crop,
                )
            }

            // Float badge — star rating
            Row(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(12.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.9f))
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Icon(Icons.Filled.Star, contentDescription = null, modifier = Modifier.size(12.dp), tint = MaterialTheme.hstaff.coral)
                Text("4.9 rated", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface)
            }

            // Float badge — verified
            Row(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(12.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.9f))
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Icon(Icons.Filled.Shield, contentDescription = null, modifier = Modifier.size(12.dp), tint = MaterialTheme.hstaff.success)
                Text("ID verified", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface)
            }

            // Float badge — price
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 14.dp)
                    .clip(CircleShape)
                    .background(Color.White.copy(alpha = 0.9f))
                    .padding(horizontal = 12.dp, vertical = 6.dp),
            ) {
                Text(
                    "₹250/hr · no hidden fees",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface,
                )
            }
        }

        Spacer(Modifier.height(32.dp))

        GradientButton(
            text = "Sign up to hire help",
            onClick = onGetStarted,
        )

        Spacer(Modifier.height(12.dp))

        OutlinedHStaffButton(
            text = "Sign up to work as a helper",
            onClick = onGetStarted,
        )

        Spacer(Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
        ) {
            Text(
                "Already have an account? ",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.hstaff.mutedFg,
            )
            androidx.compose.material3.TextButton(
                onClick = onLogin,
                contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp),
            ) {
                Text("Log in", style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold))
            }
        }

        Spacer(Modifier.height(16.dp))
    }
}

// ── Text-only logo composable (placeholder until asset is added) ───────────────

@Composable
private fun HStaffLogoCompose() {
    Text(
        text = buildAnnotatedString {
            withStyle(SpanStyle(brush = MaterialTheme.hstaff.brandGradient, fontWeight = FontWeight.ExtraBold)) {
                append("H")
            }
            withStyle(SpanStyle(fontWeight = FontWeight.Bold)) {
                append("-Staff")
            }
        },
        style = MaterialTheme.typography.headlineMedium.copy(fontSize = 22.sp),
    )
}
