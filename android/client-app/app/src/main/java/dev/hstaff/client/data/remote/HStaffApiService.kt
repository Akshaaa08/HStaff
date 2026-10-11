package dev.hstaff.client.data.remote

import dev.hstaff.client.data.remote.dto.AuthOtpRequestDto
import dev.hstaff.client.data.remote.dto.AuthOtpVerifyDto
import dev.hstaff.client.data.remote.dto.CreateShiftDto
import dev.hstaff.client.data.remote.dto.HealthDto
import dev.hstaff.client.data.remote.dto.OtpResponseDto
import dev.hstaff.client.data.remote.dto.ShiftDto
import dev.hstaff.client.data.remote.dto.TokenDto
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

/**
 * Retrofit service interface.
 * All endpoints map to the shared Node.js backend at /api/v1.
 * See docs/openapi.yaml for the full contract.
 */
interface HStaffApiService {

    @GET("health")
    suspend fun checkHealth(): HealthDto

    @POST("api/v1/auth/otp/request")
    suspend fun requestOtp(@Body body: AuthOtpRequestDto): OtpResponseDto

    @POST("api/v1/auth/otp/verify")
    suspend fun verifyOtp(@Body body: AuthOtpVerifyDto): TokenDto

    @POST("api/v1/shifts")
    suspend fun createShift(
        @Header("Authorization") bearerToken: String,
        @Body body: CreateShiftDto,
    ): ShiftDto
}
