package dev.hstaff.client.ui.screens.splash

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import dev.hstaff.client.ui.components.HStaffLogoText
import dev.hstaff.client.ui.theme.hstaff
import androidx.compose.material3.MaterialTheme
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    isAuthenticated: Boolean,
    onNavigateToHome: () -> Unit,
    onNavigateToWelcome: () -> Unit,
) {
    val scale = remember { Animatable(0.7f) }
    val alpha = remember { Animatable(0f) }

    LaunchedEffect(Unit) {
        alpha.animateTo(
            targetValue = 1f,
            animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
        )
        scale.animateTo(
            targetValue = 1f,
            animationSpec = spring(dampingRatio = 0.6f, stiffness = Spring.StiffnessMedium),
        )
        delay(1200)
        if (isAuthenticated) onNavigateToHome() else onNavigateToWelcome()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.hstaff.brandGradient),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .graphicsLayer {
                    scaleX = scale.value
                    scaleY = scale.value
                    this.alpha = alpha.value
                }
        ) {
            HStaffLogoText()
        }
    }
}
