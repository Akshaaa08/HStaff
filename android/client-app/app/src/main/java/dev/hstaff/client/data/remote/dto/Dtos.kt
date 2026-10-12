package dev.hstaff.client.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// ── DTOs (Data Transfer Objects) ─────────────────────────────────────────────
// These map 1-to-1 with the HStaff REST API JSON payloads.
// See docs/openapi.yaml for the full contract.

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
