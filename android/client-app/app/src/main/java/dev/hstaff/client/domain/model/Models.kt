package dev.hstaff.client.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// ── Booking status state machine ─────────────────────────────────────────────

enum class BookingStatus {
    DRAFT,
    OPEN,
    REQUESTED,
    ACCEPTED,
    CONFIRMED,
    EN_ROUTE,
    ARRIVED,
    IN_PROGRESS,
    COMPLETED_PENDING_PAYMENT,
    PAYMENT_PENDING,
    PAYMENT_COMPLETED,
    CLOSED,
    DECLINED,
    EXPIRED,
    CANCELLED,
    DISPUTED,
    FAILED;

    fun label(): String = when (this) {
        DRAFT -> "Draft"
        OPEN -> "Ready to request"
        REQUESTED -> "Awaiting response"
        ACCEPTED -> "Accepted"
        CONFIRMED -> "Confirmed"
        EN_ROUTE -> "On the way"
        ARRIVED -> "Arrived"
        IN_PROGRESS -> "In progress"
        COMPLETED_PENDING_PAYMENT -> "Completion requested"
        PAYMENT_PENDING -> "Payment pending"
        PAYMENT_COMPLETED -> "Paid"
        CLOSED -> "Completed"
        DECLINED -> "Declined"
        EXPIRED -> "No response"
        CANCELLED -> "Cancelled"
        DISPUTED -> "Issue reported"
        FAILED -> "Payment failed"
    }

    fun canTrack(): Boolean = this == EN_ROUTE || this == ARRIVED

    fun canFallback(): Boolean = this == DECLINED || this == EXPIRED

    fun isActive(): Boolean = this !in listOf(CLOSED, CANCELLED, FAILED)

    fun transitions(): List<BookingStatus> = when (this) {
        DRAFT -> listOf(OPEN, CANCELLED)
        OPEN -> listOf(REQUESTED, CANCELLED)
        REQUESTED -> listOf(ACCEPTED, DECLINED, EXPIRED, CANCELLED)
        ACCEPTED -> listOf(CONFIRMED, CANCELLED)
        CONFIRMED -> listOf(EN_ROUTE, CANCELLED)
        EN_ROUTE -> listOf(ARRIVED, CANCELLED)
        ARRIVED -> listOf(IN_PROGRESS, DISPUTED)
        IN_PROGRESS -> listOf(COMPLETED_PENDING_PAYMENT, DISPUTED)
        COMPLETED_PENDING_PAYMENT -> listOf(PAYMENT_PENDING, DISPUTED)
        PAYMENT_PENDING -> listOf(PAYMENT_COMPLETED, FAILED)
        FAILED -> listOf(PAYMENT_PENDING)
        PAYMENT_COMPLETED -> listOf(CLOSED)
        DECLINED -> listOf(OPEN, CANCELLED)
        EXPIRED -> listOf(OPEN, CANCELLED)
        CLOSED, CANCELLED, DISPUTED -> emptyList()
    }

    fun canTransitionTo(next: BookingStatus): Boolean = next in transitions()
}

// ── Booking draft mode ───────────────────────────────────────────────────────

enum class BookingMode { INSTANT, SCHEDULED }

// ── Core booking entity ──────────────────────────────────────────────────────

@Serializable
data class Booking(
    val id: String,
    val service: String,
    @SerialName("professional_id") val professionalId: String,
    val mode: BookingMode = BookingMode.INSTANT,
    val date: String = "",
    val time: String = "",
    val hours: Int = 1,
    val task: String = "",
    val materials: String = "",
    val notes: String = "",
    val address: String = "",
    val status: BookingStatus = BookingStatus.DRAFT,
    @SerialName("started_at") val startedAt: Long? = null,
    val rating: Int? = null,
    val review: String? = null,
    @SerialName("payment_method") val paymentMethod: String? = null,
)

fun Booking.move(to: BookingStatus): Booking {
    if (!status.canTransitionTo(to)) return this
    return copy(
        status = to,
        startedAt = if (to == BookingStatus.IN_PROGRESS) System.currentTimeMillis() else startedAt,
    )
}

// ── Professional (worker) ─────────────────────────────────────────────────────

data class Professional(
    val id: String,
    val name: String,
    val imageUrl: String,
    val rating: Double,
    val jobs: Int,
    val years: Int,
    val distanceKm: Double,
    val ratePerHour: Int,
    val skills: List<String>,
    val bio: String,
    val equipment: String,
    val languages: String,
    val onTimePercent: String,
)

// ── Service category ──────────────────────────────────────────────────────────

enum class ServiceTone { PEACH, MINT, PINK, LAVENDER, YELLOW }

data class ServiceCategory(
    val name: String,
    val fullName: String,
    val tone: ServiceTone,
)

// ── Price breakdown ───────────────────────────────────────────────────────────

data class PriceBreakdown(
    val charge: Int,
    val fee: Int,
    val total: Int,
)

fun priceFor(ratePerHour: Int, hours: Int): PriceBreakdown {
    val charge = ratePerHour * hours
    return PriceBreakdown(charge = charge, fee = 50, total = charge + 50)
}

fun Int.toInr(): String = "₹${this.toString().reversed().chunked(2).joinToString(",").reversed()}"
    .replace(",-", "-,")  // edge-case guard
fun formatInr(amount: Int): String {
    // Locale-aware INR formatting: e.g. 1250 → "₹1,250"
    return "₹" + String.format("%,d", amount).replace(",", ",")
}

// ── OTP constants (demo only — server generates real OTPs) ───────────────────

object DemoOtp {
    const val AUTH = "123456"
    const val START = "482713"
    const val END = "724819"
}

fun visibleOtp(status: BookingStatus): String? = when (status) {
    BookingStatus.ARRIVED -> DemoOtp.START
    BookingStatus.COMPLETED_PENDING_PAYMENT -> DemoOtp.END
    else -> null
}

fun verifyCode(status: BookingStatus, code: String): Boolean = when (status) {
    BookingStatus.ARRIVED -> code == DemoOtp.START
    BookingStatus.COMPLETED_PENDING_PAYMENT -> code == DemoOtp.END
    else -> false
}

// ── Cities ────────────────────────────────────────────────────────────────────

val hstaffCities = listOf(
    "Pune",
    "Mumbai",
    "Ahilyanagar",
    "Chhatrapati Sambhajinagar",
    "Nashik",
)

// ── Sample data (used when API is unavailable) ────────────────────────────────

val sampleProfessionals = listOf(
    Professional(
        id = "sunita",
        name = "Sunita Patil",
        imageUrl = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400",
        rating = 4.9,
        jobs = 184,
        years = 8,
        distanceKm = 1.2,
        ratePerHour = 250,
        skills = listOf("Regular cleaning", "Deep cleaning", "Kitchen care"),
        bio = "A little care makes a house feel like home. I've been helping Pune families keep their spaces fresh and organised for eight years.",
        equipment = "Cleaning kit, brushes and eco-friendly supplies",
        languages = "Marathi, Hindi",
        onTimePercent = "98%",
    ),
    Professional(
        id = "rahul",
        name = "Rahul Shinde",
        imageUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        rating = 4.8,
        jobs = 156,
        years = 6,
        distanceKm = 1.8,
        ratePerHour = 300,
        skills = listOf("Wiring", "Repairs", "Home maintenance"),
        bio = "Reliable help for the little things and the big fixes. I take pride in careful work, a tidy space and arriving on time.",
        equipment = "Professional toolkit and safety equipment",
        languages = "Marathi, Hindi, English",
        onTimePercent = "97%",
    ),
)

fun professionalFor(id: String): Professional =
    sampleProfessionals.find { it.id == id } ?: sampleProfessionals.first()

val sampleServices = listOf(
    ServiceCategory("Cleaning", "Housekeeping / Cleaner", ServiceTone.PEACH),
    ServiceCategory("Cooking", "Cook / Kitchen Staff", ServiceTone.YELLOW),
    ServiceCategory("Plumbing", "Plumber", ServiceTone.MINT),
    ServiceCategory("Electrical", "Electrician", ServiceTone.LAVENDER),
    ServiceCategory("Carpentry", "Carpenter", ServiceTone.PINK),
    ServiceCategory("General Help", "General Helper / Labourer", ServiceTone.MINT),
    ServiceCategory("Service Staff", "Waiter / Service Staff", ServiceTone.PEACH),
    ServiceCategory("Security", "Security Guard", ServiceTone.LAVENDER),
    ServiceCategory("Driver", "Driver", ServiceTone.YELLOW),
    ServiceCategory("Delivery", "Delivery / Logistics Worker", ServiceTone.PINK),
    ServiceCategory("Warehouse", "Warehouse Worker", ServiceTone.MINT),
    ServiceCategory("Painting", "Painter", ServiceTone.PEACH),
    ServiceCategory("AC Service", "AC / Refrigeration Technician", ServiceTone.LAVENDER),
    ServiceCategory("Appliance Repair", "Appliance Repair Technician", ServiceTone.YELLOW),
    ServiceCategory("Welding", "Welder / Fabricator", ServiceTone.PINK),
)
