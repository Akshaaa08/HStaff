package dev.hstaff.client.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.hstaff.client.R

// Inter font family — matches --font-sans: 'Inter', sans-serif in the web app.
// Download Inter TTF files into res/font/ (inter_regular.ttf, inter_medium.ttf,
// inter_semibold.ttf, inter_bold.ttf, inter_extrabold.ttf).
// If you prefer to load from Google Fonts at runtime, replace with
// GoogleFont("Inter") using the downloadable-fonts API.
val InterFontFamily = FontFamily(
    Font(R.font.inter_regular, FontWeight.Normal),
    Font(R.font.inter_medium, FontWeight.Medium),
    Font(R.font.inter_semibold, FontWeight.SemiBold),
    Font(R.font.inter_bold, FontWeight.Bold),
    Font(R.font.inter_extrabold, FontWeight.ExtraBold),
)

// HStaff Material 3 Typography
val HStaffTypography = Typography(
    // Large hero heading — "Who do you need today?" (32sp, ExtraBold)
    displaySmall = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 32.sp,
        lineHeight = 37.sp,
        letterSpacing = (-0.5).sp,
    ),
    // Section headings — "Popular services" (18sp, Bold 750)
    headlineMedium = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 18.sp,
        lineHeight = 24.sp,
    ),
    // Screen headings — "Let's make it happen." (27sp)
    headlineLarge = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 27.sp,
        lineHeight = 33.sp,
        letterSpacing = (-0.3).sp,
    ),
    // Sub-screen heading in ScreenTop bar (16sp)
    titleMedium = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 24.sp,
    ),
    // Professional name, card titles (15sp, Bold)
    titleSmall = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 15.sp,
        lineHeight = 22.sp,
    ),
    // Body text (14sp, Normal) — default
    bodyMedium = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 22.sp,
    ),
    // Subtle / muted text (12sp)
    bodySmall = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 19.sp,
    ),
    // Labels, eyebrows (10sp, Bold, uppercase handled in composable)
    labelSmall = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 10.sp,
        letterSpacing = 0.5.sp,
    ),
    // Field labels (13sp, SemiBold)
    labelMedium = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 13.sp,
        lineHeight = 20.sp,
    ),
    // Chips, dock labels (11sp, SemiBold)
    labelLarge = TextStyle(
        fontFamily = InterFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 11.sp,
        lineHeight = 16.sp,
    ),
)
