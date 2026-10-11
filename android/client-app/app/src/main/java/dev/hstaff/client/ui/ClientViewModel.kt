package dev.hstaff.client.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dev.hstaff.client.data.remote.ApiClient
import dev.hstaff.client.data.remote.dto.AuthOtpRequestDto
import dev.hstaff.client.data.remote.dto.AuthOtpVerifyDto
import dev.hstaff.client.data.remote.dto.CreateShiftDto
import dev.hstaff.client.domain.model.Booking
import dev.hstaff.client.domain.model.BookingMode
import dev.hstaff.client.domain.model.BookingStatus
import dev.hstaff.client.domain.model.DemoOtp
import dev.hstaff.client.domain.model.Professional
import dev.hstaff.client.domain.model.ServiceCategory
import dev.hstaff.client.domain.model.hstaffCities
import dev.hstaff.client.domain.model.move
import dev.hstaff.client.domain.model.professionalFor
import dev.hstaff.client.domain.model.sampleProfessionals
import dev.hstaff.client.domain.model.sampleServices
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

// ── Session state ─────────────────────────────────────────────────────────────

data class ClientSession(
    val authenticated: Boolean = false,
    val phone: String = "",
    val name: String = "Akshaa",
    val city: String = "Pune",
    val activeBooking: Booking? = null,
    val pastBookings: List<Booking> = emptyList(),
    val apiConnected: Boolean = false,
)

// ── Draft booking ─────────────────────────────────────────────────────────────

data class BookingDraft(
    val service: String = "Cleaning",
    val mode: BookingMode = BookingMode.INSTANT,
    val date: String = "",
    val time: String = "",
    val hours: Int = 1,
    val task: String = "Regular Cleaning",
    val materials: String = "I'll provide them",
    val notes: String = "",
    val address: String = "Home · 24, Green Park, Baner, Pune",
    val selectedProId: String = "sunita",
)

// ── UI events ─────────────────────────────────────────────────────────────────

sealed class ClientUiEvent {
    data class ShowError(val message: String) : ClientUiEvent()
    data class ShowNotice(val message: String) : ClientUiEvent()
    data object NavigateToHome : ClientUiEvent()
}

// ── ViewModel ─────────────────────────────────────────────────────────────────

class ClientViewModel : ViewModel() {

    private val _session = MutableStateFlow(ClientSession())
    val session: StateFlow<ClientSession> = _session.asStateFlow()

    private val _draft = MutableStateFlow(BookingDraft())
    val draft: StateFlow<BookingDraft> = _draft.asStateFlow()

    private val _pendingPhone = MutableStateFlow("")
    val pendingPhone: StateFlow<String> = _pendingPhone.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _noticeMessage = MutableStateFlow<String?>(null)
    val noticeMessage: StateFlow<String?> = _noticeMessage.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _sortMode = MutableStateFlow("Recommended")
    val sortMode: StateFlow<String> = _sortMode.asStateFlow()

    // Elapsed seconds for the in-progress timer
    private val _elapsedSeconds = MutableStateFlow(0L)
    val elapsedSeconds: StateFlow<Long> = _elapsedSeconds.asStateFlow()

    init {
        checkApiHealth()
        startShiftTimer()
    }

    // ── API health check ──────────────────────────────────────────────────────

    private fun checkApiHealth() {
        viewModelScope.launch {
            try {
                val health = ApiClient.service.checkHealth()
                _session.update { it.copy(apiConnected = health.status == "ok") }
            } catch (_: Exception) { /* offline — silent */ }
        }
    }

    // ── Auth ──────────────────────────────────────────────────────────────────

    fun setPendingPhone(phone: String) { _pendingPhone.value = phone }

    fun requestOtp(phone: String, onSuccess: () -> Unit) {
        if (!phone.matches(Regex("^[6-9]\\d{9}$"))) {
            _errorMessage.value = "Enter a valid 10-digit Indian mobile number."
            return
        }
        _isLoading.value = true
        _errorMessage.value = null
        viewModelScope.launch {
            try {
                ApiClient.service.requestOtp(AuthOtpRequestDto(phone = phone, role = "client"))
            } catch (_: Exception) { /* fallback to demo OTP */ }
            _isLoading.value = false
            onSuccess()
        }
    }

    fun verifyOtp(phone: String, otp: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        _isLoading.value = true
        viewModelScope.launch {
            try {
                val token = ApiClient.service.verifyOtp(
                    AuthOtpVerifyDto(phone = phone, otp = otp, role = "client")
                )
                _session.update { it.copy(authenticated = true, phone = phone) }
                onSuccess()
            } catch (e: Exception) {
                if (otp == DemoOtp.AUTH) {
                    _session.update { it.copy(authenticated = true, phone = phone) }
                    onSuccess()
                } else {
                    onError(e.message ?: "Please enter the six-digit demo code.")
                }
            }
            _isLoading.value = false
        }
    }

    fun logout() {
        _session.update { ClientSession() }
    }

    // ── Draft management ──────────────────────────────────────────────────────

    fun selectService(service: String) {
        _draft.update {
            it.copy(
                service = service,
                task = if (service == "Cleaning") "Regular Cleaning" else "$service service",
                selectedProId = if (service == "Electrical") "rahul" else "sunita",
            )
        }
    }

    fun updateDraft(updater: (BookingDraft) -> BookingDraft) {
        _draft.update(updater)
    }

    fun setSearchQuery(q: String) { _searchQuery.value = q }
    fun setSortMode(mode: String) { _sortMode.value = mode }

    fun filteredServices(): List<ServiceCategory> {
        val q = _searchQuery.value.lowercase()
        return if (q.isEmpty()) sampleServices
        else sampleServices.filter { it.name.lowercase().contains(q) || it.fullName.lowercase().contains(q) }
    }

    fun sortedProfessionals(): List<Professional> {
        return when (_sortMode.value) {
            "Nearest"  -> sampleProfessionals.sortedBy { it.distanceKm }
            "Top Rated" -> sampleProfessionals.sortedByDescending { it.rating }
            "Price"    -> sampleProfessionals.sortedBy { it.ratePerHour }
            else       -> sampleProfessionals.toList()
        }
    }

    // ── Booking flow ──────────────────────────────────────────────────────────

    fun sendRequest(onNavigateToService: () -> Unit) {
        val d = _draft.value
        val booking = Booking(
            id = "HS-${(100000..999999).random()}",
            service = d.service,
            professionalId = d.selectedProId,
            mode = d.mode,
            date = d.date,
            time = d.time,
            hours = d.hours,
            task = d.task,
            materials = d.materials,
            notes = d.notes,
            address = d.address,
            status = BookingStatus.DRAFT,
        ).move(BookingStatus.OPEN).move(BookingStatus.REQUESTED)

        _session.update { it.copy(activeBooking = booking) }
        onNavigateToService()

        // Simulate professional response after 3 seconds
        viewModelScope.launch {
            delay(3000)
            _session.update { s ->
                val b = s.activeBooking ?: return@update s
                if (b.status != BookingStatus.REQUESTED) return@update s
                val accepted = b.move(BookingStatus.ACCEPTED).move(BookingStatus.CONFIRMED)
                s.copy(activeBooking = accepted)
            }
        }

        // Also try the real API
        if (_session.value.apiConnected) {
            viewModelScope.launch {
                try {
                    ApiClient.service.createShift(
                        bearerToken = "Bearer demo",
                        body = CreateShiftDto(
                            workerId = if (d.selectedProId == "rahul")
                                "00000000-0000-0000-0000-000000000003"
                            else
                                "00000000-0000-0000-0000-000000000002",
                            skill = d.service,
                            durationMinutes = d.hours * 60,
                            isInstant = d.mode == BookingMode.INSTANT,
                            lat = 18.559,
                            lng = 73.7868,
                            address = d.address,
                            notes = d.notes,
                            materials = d.materials,
                        )
                    )
                } catch (_: Exception) { /* silent — local state is source of truth */ }
            }
        }
    }

    fun transitionBooking(to: BookingStatus) {
        _session.update { s ->
            val b = s.activeBooking ?: return@update s
            s.copy(activeBooking = b.move(to))
        }
    }

    fun cancelBooking() {
        transitionBooking(BookingStatus.CANCELLED)
    }

    fun verifyOtpCode(code: String): Boolean {
        val b = _session.value.activeBooking ?: return false
        return when (b.status) {
            BookingStatus.ARRIVED -> code == DemoOtp.START
            BookingStatus.COMPLETED_PENDING_PAYMENT -> code == DemoOtp.END
            else -> false
        }
    }

    fun completeWithOtp(onNavigate: () -> Unit) {
        val b = _session.value.activeBooking ?: return
        when (b.status) {
            BookingStatus.ARRIVED -> transitionBooking(BookingStatus.IN_PROGRESS)
            BookingStatus.COMPLETED_PENDING_PAYMENT -> {
                // Customer flow: go to payment
                transitionBooking(BookingStatus.PAYMENT_PENDING)
                onNavigate()
            }
            else -> Unit
        }
    }

    fun simulatePayment(method: String, fail: Boolean = false, onNavigate: () -> Unit) {
        _isLoading.value = true
        viewModelScope.launch {
            delay(700)
            _session.update { s ->
                val b = s.activeBooking ?: return@update s
                val updated = if (fail)
                    b.copy(status = BookingStatus.FAILED)
                else
                    b.move(BookingStatus.PAYMENT_COMPLETED).copy(paymentMethod = method)
                s.copy(activeBooking = updated)
            }
            _isLoading.value = false
            if (!fail) onNavigate()
        }
    }

    fun submitReview(rating: Int, tags: List<String>, reviewText: String, onNavigate: () -> Unit) {
        if (rating == 0) {
            _errorMessage.value = "Please choose a rating."
            return
        }
        _session.update { s ->
            val b = s.activeBooking ?: return@update s
            val closed = b.copy(
                status = BookingStatus.CLOSED,
                rating = rating,
                review = (tags + listOf(reviewText)).filter { it.isNotBlank() }.joinToString(" · "),
            )
            s.copy(
                activeBooking = closed,
                pastBookings = listOf(closed) + s.pastBookings.filter { it.id != closed.id },
            )
        }
        onNavigate()
    }

    // ── City / profile ────────────────────────────────────────────────────────

    fun setCity(city: String) { _session.update { it.copy(city = city) } }

    // ── Timer for IN_PROGRESS elapsed time ────────────────────────────────────

    private fun startShiftTimer() {
        viewModelScope.launch {
            while (true) {
                delay(1000)
                val b = _session.value.activeBooking
                if (b?.status == BookingStatus.IN_PROGRESS && b.startedAt != null) {
                    _elapsedSeconds.value = (System.currentTimeMillis() - b.startedAt) / 1000
                }
            }
        }
    }

    // ── Error / notice helpers ────────────────────────────────────────────────

    fun clearError() { _errorMessage.value = null }
    fun clearNotice() { _noticeMessage.value = null }
    fun showError(msg: String) { _errorMessage.value = msg }
}
