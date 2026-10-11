package dev.hstaff.client.ui.screens.welcome

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.hstaff.client.domain.model.sampleServices
import dev.hstaff.client.ui.ClientViewModel
import dev.hstaff.client.ui.components.ScreenTopBar
import dev.hstaff.client.ui.components.ServiceTile
import dev.hstaff.client.ui.theme.hstaff

/**
 * Full discover / search screen — shows all 15 service categories with search.
 */
@Composable
fun DiscoverScreen(
    viewModel: ClientViewModel,
    onBack: () -> Unit,
    onServiceSelected: (String) -> Unit,
) {
    val query by viewModel.searchQuery.collectAsState()
    val filtered = viewModel.filteredServices()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 8.dp),
    ) {
        ScreenTopBar(title = "Discover", onBack = onBack)

        Text("A person for every task.", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(4.dp))
        Text(
            "Find the right help for your home and your day.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.hstaff.mutedFg,
        )
        Spacer(Modifier.height(16.dp))

        // Search field
        OutlinedTextField(
            value = query,
            onValueChange = { viewModel.setSearchQuery(it) },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Search services…", color = MaterialTheme.hstaff.mutedFg) },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = "Search") },
            shape = RoundedCornerShape(16.dp),
            singleLine = true,
        )

        Spacer(Modifier.height(20.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text("All services", style = MaterialTheme.typography.titleSmall)
            Text(
                "${filtered.size} services",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.hstaff.mutedFg,
            )
        }

        Spacer(Modifier.height(12.dp))

        if (filtered.isEmpty()) {
            Text(
                "No services found. Try cleaning, cooking or a repair service.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.hstaff.mutedFg,
            )
        } else {
            filtered.forEach { service ->
                ServiceTile(
                    service = service,
                    onClick = {
                        viewModel.setSearchQuery("")
                        onServiceSelected(service.name)
                    },
                )
                Spacer(Modifier.height(10.dp))
            }
        }

        Spacer(Modifier.height(100.dp))
    }
}
