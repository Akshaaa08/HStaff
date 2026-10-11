package dev.hstaff.client.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// ── Extended theme tokens (beyond Material 3 slots) ─────────────────────────

data class HStaffColors(
    val canvas: Color,
    val mutedBg: Color,
    val mutedFg: Color,
    val border: Color,
    val cardBg: Color,
    val glass: Color,
    val peach: Color,
    val coral: Color,
    val hstaffPink: Color,
    val softPink: Color,
    val mint: Color,
    val lavender: Color,
    val yellow: Color,
    val success: Color,
    val successSoft: Color,
    val brandGradient: Brush,
)

val LocalHStaffColors = staticCompositionLocalOf {
    HStaffColors(
        canvas = Canvas,
        mutedBg = MutedBg,
        mutedFg = MutedFg,
        border = Border,
        cardBg = CardBg,
        glass = Glass,
        peach = Peach,
        coral = Coral,
        hstaffPink = HStaffPink,
        softPink = SoftPink,
        mint = Mint,
        lavender = Lavender,
        yellow = Yellow,
        success = Success,
        successSoft = SuccessSoft,
        brandGradient = Brush.linearGradient(listOf(Peach, Coral, HStaffPink)),
    )
}

private val LightColorScheme = lightColorScheme(
    primary = Foreground,
    onPrimary = Background,
    primaryContainer = Peach,
    onPrimaryContainer = Foreground,
    secondary = MutedBg,
    onSecondary = Foreground,
    secondaryContainer = SoftPink,
    onSecondaryContainer = Foreground,
    tertiary = HStaffPink,
    onTertiary = Background,
    background = Canvas,
    onBackground = Foreground,
    surface = Background,
    onSurface = Foreground,
    surfaceVariant = MutedBg,
    onSurfaceVariant = MutedFg,
    outline = Border,
    error = Destructive,
    onError = Background,
)

private val DarkColorScheme = darkColorScheme(
    primary = HStaffPink,
    onPrimary = DarkBackground,
    primaryContainer = Color(0xFF4A1A30),
    onPrimaryContainer = SoftPink,
    secondary = DarkMutedBg,
    onSecondary = DarkForeground,
    background = DarkCanvas,
    onBackground = DarkForeground,
    surface = DarkCard,
    onSurface = DarkForeground,
    surfaceVariant = DarkMutedBg,
    onSurfaceVariant = DarkMutedFg,
    outline = DarkBorder,
    error = Color(0xFFFF6B6B),
    onError = DarkBackground,
)

private val DarkHStaffColors = HStaffColors(
    canvas = DarkCanvas,
    mutedBg = DarkMutedBg,
    mutedFg = DarkMutedFg,
    border = DarkBorder,
    cardBg = DarkCard,
    glass = DarkGlass,
    peach = Peach,
    coral = Coral,
    hstaffPink = HStaffPink,
    softPink = SoftPink,
    mint = Mint,
    lavender = Lavender,
    yellow = Yellow,
    success = Success,
    successSoft = Color(0xFF1A3D2E),
    brandGradient = Brush.linearGradient(listOf(Color(0xFFCC8866), Coral, HStaffPink)),
)

@Composable
fun HStaffClientTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val hstaffColors = if (darkTheme) DarkHStaffColors else LocalHStaffColors.current

    CompositionLocalProvider(LocalHStaffColors provides hstaffColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = HStaffTypography,
            content = content,
        )
    }
}

// Convenience extension so screens can write: MaterialTheme.hstaff.brandGradient
val MaterialTheme.hstaff: HStaffColors
    @Composable get() = LocalHStaffColors.current
