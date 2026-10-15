import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Platform, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  rate?: number;
  type: 'client' | 'worker';
}

interface LeafletMapProps {
  clientCoords?: { latitude: number; longitude: number; label?: string };
  workerCoords?: { latitude: number; longitude: number; name?: string; rate?: number };
  workers?: Array<{ id: string; name: string; latitude: number; longitude: number; rate?: number; service?: string }>;
  height?: number;
  zoom?: number;
  showRoute?: boolean;
  distanceKm?: number;
  style?: ViewStyle;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  clientCoords,
  workerCoords,
  workers,
  height = 220,
  zoom = 14,
  showRoute = true,
  distanceKm,
  style,
}) => {
  // Center coordinates fallback (Pune)
  const defaultLat = clientCoords?.latitude || workerCoords?.latitude || 18.5204;
  const defaultLon = clientCoords?.longitude || workerCoords?.longitude || 73.8567;

  // Compile markers list
  const markers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];
    if (clientCoords) {
      list.push({
        id: 'client_pin',
        latitude: clientCoords.latitude,
        longitude: clientCoords.longitude,
        title: 'Client Location',
        subtitle: clientCoords.label || 'Your Location',
        type: 'client',
      });
    }

    if (workerCoords) {
      list.push({
        id: 'worker_pin',
        latitude: workerCoords.latitude,
        longitude: workerCoords.longitude,
        title: workerCoords.name || 'Verified Professional',
        subtitle: workerCoords.rate ? `₹${workerCoords.rate}/hr` : undefined,
        rate: workerCoords.rate,
        type: 'worker',
      });
    }

    if (workers && workers.length > 0) {
      workers.forEach((w) => {
        if (w.latitude && w.longitude) {
          list.push({
            id: w.id,
            latitude: w.latitude,
            longitude: w.longitude,
            title: w.name,
            subtitle: w.service || (w.rate ? `₹${w.rate}/hr` : undefined),
            rate: w.rate,
            type: 'worker',
          });
        }
      });
    }

    return list;
  }, [clientCoords, workerCoords, workers]);

  // Generate Leaflet HTML
  const htmlContent = useMemo(() => {
    const markersJson = JSON.stringify(markers);
    const hasClientAndWorker = !!clientCoords && (!!workerCoords || (workers && workers.length > 0));
    const primaryWorkerLat = workerCoords?.latitude || (workers && workers[0]?.latitude);
    const primaryWorkerLon = workerCoords?.longitude || (workers && workers[0]?.longitude);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; background: #F8FAFC; }
    #map { width: 100%; height: 100%; }
    .client-marker {
      background: #FF6B4A;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 10px rgba(255, 107, 74, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      font-family: -apple-system, sans-serif;
    }
    .worker-marker {
      background: #10B981;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      font-family: -apple-system, sans-serif;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 2px;
      box-shadow: 0 6px 16px rgba(0,0,0,0.18);
    }
    .popup-title { font-weight: 800; color: #0F172A; font-size: 13px; }
    .popup-sub { color: #64748B; font-size: 11px; margin-top: 2px; }
    .popup-badge { display: inline-block; padding: 2px 6px; border-radius: 6px; background: #ECFDF5; color: #065F46; font-size: 10px; font-weight: 700; margin-top: 4px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${defaultLat}, ${defaultLon}], ${zoom});

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var markersData = ${markersJson};
    var latLngList = [];

    markersData.forEach(function(m) {
      var isClient = m.type === 'client';
      var className = isClient ? 'client-marker' : 'worker-marker';
      var symbol = isClient ? '⌂' : '✓';

      var customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="' + className + '">' + symbol + '</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      var marker = L.marker([m.latitude, m.longitude], { icon: customIcon }).addTo(map);
      latLngList.push([m.latitude, m.longitude]);

      var popupHtml = '<div class="popup-title">' + (isClient ? '📍 Client Location' : '👤 ' + m.title) + '</div>';
      if (m.subtitle) {
        popupHtml += '<div class="popup-sub">' + m.subtitle + '</div>';
      }
      if (!isClient && m.rate) {
        popupHtml += '<div class="popup-badge">Rate: ₹' + m.rate + '/hr</div>';
      }
      marker.bindPopup(popupHtml);
    });

    // Draw route if client and worker both exist
    ${
      showRoute && hasClientAndWorker && primaryWorkerLat && primaryWorkerLon
        ? `
      var routeLine = L.polyline([
        [${clientCoords.latitude}, ${clientCoords.longitude}],
        [${primaryWorkerLat}, ${primaryWorkerLon}]
      ], {
        color: '#FF6B4A',
        weight: 3.5,
        dashArray: '6, 8',
        opacity: 0.85
      }).addTo(map);
    `
        : ''
    }

    if (latLngList.length > 1) {
      map.fitBounds(latLngList, { padding: [35, 35], maxZoom: 15 });
    } else if (latLngList.length === 1) {
      map.setView(latLngList[0], 14);
    }
  </script>
</body>
</html>
    `;
  }, [markers, clientCoords, workerCoords, workers, defaultLat, defaultLon, zoom, showRoute]);

  return (
    <View style={[styles.container, { height }, style]}>
      {Platform.OS === 'web' ? (
        // Web fallback using iframe with srcDoc
        <View style={StyleSheet.absoluteFill}>
          {React.createElement('iframe', {
            srcDoc: htmlContent,
            style: { width: '100%', height: '100%', border: 'none', borderRadius: 20 },
            title: 'Leaflet OpenStreetMap',
          })}
        </View>
      ) : (
        // Mobile Native WebView
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webView}
          scrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      )}

      {/* Floating OSM & Distance Badges */}
      <View style={styles.topBadgeRow}>
        <View style={styles.osmBadge}>
          <Ionicons name="map-outline" size={11} color={Colors.mutedFg} />
          <Text style={styles.osmText}>OpenStreetMap · Leaflet</Text>
        </View>

        {distanceKm !== undefined ? (
          <View style={styles.distBadge}>
            <Ionicons name="navigate" size={11} color="#FFFFFF" />
            <Text style={styles.distBadgeText}>{distanceKm} km away</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  osmBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  osmText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mutedFg,
  },
  distBadge: {
    backgroundColor: Colors.coral,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    shadowColor: Colors.coral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  distBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
