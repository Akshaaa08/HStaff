package dev.hstaff.client.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.hstaff.client.ui.ClientViewModel
import dev.hstaff.client.ui.components.GradientButton
import dev.hstaff.client.ui.components.ScreenTopBar
import dev.hstaff.client.ui.components.StateSymbol
import dev.hstaff.client.ui.theme.hstaff

// ── Phone entry screen ────────────────────────────────────────────────────────

@Composable
fun AuthPhoneScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onOtpSent: (phone: String) -> Unit,
) {
    var phone by remember { mutableStateOf("") }
    var localError by remember { mutableStateOf("") }
    val isLoading by viewModel.isLoading.collectAsState()

    fun submit() {
        if (!phone.matches(Regex("^[6-9]\\d{9}$"))) {
            localError = "Enter a valid 10-digit Indian mobile number."
            return
        }
        localError = ""
        viewModel.requestOtp(phone) { onOtpSent(phone) }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Your mobile number", onBack = onBack)

        Spacer(Modifier.height(8.dp))

        StateSymbol(content = {
            Icon(
                imageVector = Icons.Filled.Phone,
                contentDescription = null,
                modifier = Modifier.size(33.dp),
                tint = Color.White,
            )
        })

        Spacer(Modifier.height(24.dp))

        Text(
            text = "Let's stay connected.",
            style = MaterialTheme.typography.headlineLarge,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "We'll send a code to verify your mobile number.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.hstaff.mutedFg,
        )

        Spacer(Modifier.height(24.dp))

        Text(
            text = "Mobile number",
            style = MaterialTheme.typography.labelMedium,
        )
        Spacer(Modifier.height(8.dp))

        // Phone input with +91 prefix
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(15.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.hstaff.border, RoundedCornerShape(15.dp))
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "+91",
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(end = 12.dp),
            )
            OutlinedTextField(
                value = phone,
                onValueChange = { v ->
                    phone = v.filter { it.isDigit() }.take(10)
                    localError = ""
                },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("98765 43210", color = MaterialTheme.hstaff.mutedFg) },
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Phone,
                    imeAction = ImeAction.Done,
                ),
                keyboardActions = KeyboardActions(onDone = { submit() }),
                colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color.Transparent,
                    unfocusedBorderColor = Color.Transparent,
                ),
            )
        }

        if (localError.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(
                text = localError,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
            )
        }

        Spacer(Modifier.height(24.dp))

        if (isLoading) {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MaterialTheme.hstaff.coral)
            }
        } else {
            GradientButton(text = "Send verification code", onClick = ::submit)
        }

        Spacer(Modifier.height(16.dp))
        Text(
            text = "Prototype sign-in. No SMS will be sent.",
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.hstaff.mutedFg,
        )
    }
}

// ── OTP verification screen ───────────────────────────────────────────────────

@Composable
fun AuthOtpScreen(
    phone: String,
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onAuthenticated: () -> Unit,
) {
    var otp by remember { mutableStateOf("") }
    var localError by remember { mutableStateOf("") }
    val isLoading by viewModel.isLoading.collectAsState()

    fun verify() {
        if (otp.length < 6) {
            localError = "Enter the 6-digit code."
            return
        }
        localError = ""
        viewModel.verifyOtp(
            phone = phone,
            otp = otp,
            onSuccess = onAuthenticated,
            onError = { msg -> localError = msg },
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Verify your mobile", onBack = onBack)

        Spacer(Modifier.height(8.dp))

        StateSymbol(content = {
            Icon(
                imageVector = Icons.Filled.Shield,
                contentDescription = null,
                modifier = Modifier.size(33.dp),
                tint = Color.White,
            )
        })

        Spacer(Modifier.height(24.dp))

        Text("A quick check.", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Enter the six-digit code to continue.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.hstaff.mutedFg,
        )

        Spacer(Modifier.height(24.dp))

        Text("Verification code", style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(8.dp))

        OutlinedTextField(
            value = otp,
            onValueChange = { v ->
                otp = v.filter { it.isDigit() }.take(6)
                localError = ""
            },
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(15.dp)),
            placeholder = { Text("6-digit code", color = MaterialTheme.hstaff.mutedFg) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.NumberPassword,
                imeAction = ImeAction.Done,
            ),
            keyboardActions = KeyboardActions(onDone = { verify() }),
            shape = RoundedCornerShape(15.dp),
        )

        Spacer(Modifier.height(8.dp))
        Text(
            text = "Demo code: 123456",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.hstaff.mutedFg,
        )

        if (localError.isNotEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text(
                text = localError,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
            )
        }

        Spacer(Modifier.height(24.dp))

        if (isLoading) {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = MaterialTheme.hstaff.coral)
            }
        } else {
            GradientButton(text = "Verify & continue", onClick = ::verify)
        }

        Spacer(Modifier.height(12.dp))
        androidx.compose.material3.TextButton(
            onClick = { /* resend */ },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Resend code")
        }
    }
}
