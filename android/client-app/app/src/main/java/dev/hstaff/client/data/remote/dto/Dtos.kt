package dev.hstaff.client.data.remote

import dev.hstaff.client.BuildConfig
import dev.hstaff.client.data.remote.dto.AuthOtpRequestDto
import dev.hstaff.client.data.remote.dto.AuthOtpVerifyDto
import dev.hstaff.client.data.remote.dto.CreateShiftDto
import dev.hstaff.client.data.remote.dto.HealthDto
import dev.hstaff.client.data.remote.dto.OtpResponseDto
import dev.hstaff.client.data.remote.dto.ShiftDto
import dev.hstaff.client.data.remote.dto.TokenDto
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Header
import java.util.concurrent.TimeUnit

// ── DTOs ─────────────────────────────────────────────────────────────────────

package dev.hstaff.client.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class HealthDto(
    val status: String,
    val db: String? = null,
    val redis: String? = null,
)

@Serializable
data class AuthOtpRequestDto(
    val phone: String,
    val role: String,
)

@Serializable
data class OtpResponseDto(
    val message: String,
    @SerialName("debug_code") val debugCode: String? = null,
)

@Serializable
data class AuthOtpVerifyDto(
    val phone: String,
    val otp: String,
    val role: String,
    val name: String? = null,
)

@Serializable
data class TokenDto(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
    @SerialName("user_id") val userId: String,
    val role: String,
)

@Serializable
data class CreateShiftDto(
    @SerialName("worker_id") val workerId: String,
    val skill: String,
    @SerialName("duration_minutes") val durationMinutes: Int,
    @SerialName("is_instant") val isInstant: Boolean,
    val lat: Double,
    val lng: Double,
    val address: String,
    val notes: String = "",
    val materials: String = "",
)

@Serializable
data class ShiftDto(
    val id: String,
    val status: String,
    @SerialName("worker_id") val workerId: String,
    val skill: String,
    @SerialName("duration_minutes") val durationMinutes: Int,
    val address: String,
)
