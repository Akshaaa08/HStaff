import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { ScreenTopBar } from '../components/common/ScreenTopBar';
import { GradientButton } from '../components/common/GradientButton';
import { ApiClient } from '../services/api';
import { getAutoGpsLocation } from '../utils/location';

interface SignupScreenProps {
  onBack?: () => void;
  onComplete: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ onBack, onComplete }) => {
  const { session, completeSignup, isLoading, errorMessage, clearError } = useApp();

  const [role, setRole] = useState<'client' | 'worker'>(session.role || 'client');
  const [name, setName] = useState<string>(session.name !== 'Client User' ? session.name : '');
  const [email, setEmail] = useState<string>(session.email || '');

  // Worker-specific Photo State (Mandatory for worker, never asked for client)
  const [workerPhoto, setWorkerPhoto] = useState<string>(session.imageUrl || '');

  // Address & Automatic GPS State
  const [isGpsDetecting, setIsGpsDetecting] = useState<boolean>(false);
  const [addressSearch, setAddressSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState<boolean>(false);
  const [selectedAddress, setSelectedAddress] = useState<{
    displayName: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    lat: number;
    lon: number;
  } | null>(
    session.address
      ? {
          displayName: session.address,
          city: session.city,
          lat: session.latitude || 18.5204,
          lon: session.longitude || 73.8567,
        }
      : null
  );
  const [houseFlat, setHouseFlat] = useState<string>(session.houseFlat || '');
  const [landmark, setLandmark] = useState<string>(session.landmark || '');

  // Worker-specific Professional State
  const [serviceCategory, setServiceCategory] = useState<string>(
    session.serviceCategory || 'Cleaning'
  );
  const [years, setYears] = useState<string>(session.years ? String(session.years) : '3');
  const [experienceDetails, setExperienceDetails] = useState<string>(
    session.experienceDetails || ''
  );
  const [skills, setSkills] = useState<string>(
    session.skills ? session.skills.join(', ') : 'Home cleaning, Deep kitchen cleaning'
  );
  const [ratePerHour, setRatePerHour] = useState<string>(
    session.ratePerHour ? String(session.ratePerHour) : '250'
  );
  const [equipment, setEquipment] = useState<string>(
    session.equipment || 'Eco-friendly supplies and personal toolkit'
  );
  const [languages, setLanguages] = useState<string>(session.languages || 'Hindi, Marathi');
  const [bio, setBio] = useState<string>(session.bio || '');

  const [localError, setLocalError] = useState<string>('');

  const servicesList = [
    'Cleaning',
    'Cooking',
    'Plumbing',
    'Electrical',
    'Carpentry',
    'General Help',
    'Painting',
    'AC Service',
    'Driver',
    'Delivery',
  ];

  // Automatically detect GPS location on mount for both client and worker
  const autoDetectGps = async () => {
    setIsGpsDetecting(true);
    setLocalError('');
    try {
      const res = await getAutoGpsLocation();
      if (res) {
        setSelectedAddress({
          displayName: res.displayName,
          city: res.city,
          state: res.state,
          postcode: res.postcode,
          lat: res.latitude,
          lon: res.longitude,
        });
      }
    } catch {
      // Fallback
    } finally {
      setIsGpsDetecting(false);
    }
  };

  useEffect(() => {
    if (!selectedAddress) {
      autoDetectGps();
    }
  }, []);

  // Worker Image Picker Functions
  const pickWorkerPhoto = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        setWorkerPhoto(res.assets[0].uri);
        setLocalError('');
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const takeWorkerPhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Camera Permission Needed', 'Please allow camera access to take your profile picture.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        setWorkerPhoto(res.assets[0].uri);
        setLocalError('');
      }
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };

  // Debounced OpenStreetMap address search
  useEffect(() => {
    if (addressSearch.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMap(true);
      try {
        const results = await ApiClient.maps.searchAddress(addressSearch);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearchingMap(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [addressSearch]);

  const handleSelectMapPlace = (place: any) => {
    setSelectedAddress(place);
    setAddressSearch('');
    setSearchResults([]);
    setLocalError('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }

    if (!selectedAddress && !addressSearch.trim()) {
      setLocalError('Please detect or select your location via GPS.');
      return;
    }

    const fullAddress = selectedAddress
      ? `${houseFlat ? `${houseFlat}, ` : ''}${selectedAddress.displayName}${
          landmark ? ` (Near: ${landmark})` : ''
        }`
      : `${houseFlat ? `${houseFlat}, ` : ''}${addressSearch}${
          landmark ? ` (Near: ${landmark})` : ''
        }`;

    const payload: any = {
      name: name.trim(),
      email: email.trim(),
      role,
      address: fullAddress,
      houseFlat: houseFlat.trim(),
      landmark: landmark.trim(),
      city: selectedAddress?.city || 'Pune',
      state: selectedAddress?.state || 'Maharashtra',
      postalCode: selectedAddress?.postcode || '',
      latitude: selectedAddress?.lat || 18.5204,
      longitude: selectedAddress?.lon || 73.8567,
    };

    // Strict validation for Worker role
    if (role === 'worker') {
      if (!workerPhoto) {
        setLocalError('Profile photo is mandatory for verified workers. Please take a photo or select from gallery.');
        return;
      }
      if (!experienceDetails.trim()) {
        setLocalError('Please provide a brief description of your work experience.');
        return;
      }
      payload.imageUrl = workerPhoto;
      payload.serviceCategory = serviceCategory;
      payload.years = parseInt(years, 10) || 1;
      payload.experienceDetails = experienceDetails.trim();
      payload.skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
      payload.ratePerHour = parseInt(ratePerHour, 10) || 250;
      payload.equipment = equipment.trim();
      payload.languages = languages.trim();
      payload.bio = bio.trim() || experienceDetails.trim();
    }

    setLocalError('');
    clearError();

    await completeSignup(
      payload,
      () => onComplete(),
      (errMsg) => setLocalError(errMsg)
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTopBar title={role === 'client' ? 'Client Profile' : 'Worker Registration'} onBack={onBack} />

      <Text style={styles.headline}>
        {role === 'client' ? 'Tell us about you' : 'Register as a Professional'}
      </Text>
      <Text style={styles.subhead}>
        {role === 'client'
          ? 'Quick setup to find and hire verified domestic staff in minutes.'
          : 'Create your worker profile to start receiving direct job requests from clients nearby.'}
      </Text>

      {/* Role Switcher Tabs */}
      <View style={styles.roleContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.roleTab, role === 'client' && styles.roleTabActive]}
          onPress={() => {
            setRole('client');
            setLocalError('');
          }}
        >
          <Ionicons
            name="person"
            size={18}
            color={role === 'client' ? '#FFFFFF' : Colors.mutedFg}
          />
          <Text style={[styles.roleTabText, role === 'client' && styles.roleTabTextActive]}>
            Client (Hire Help)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.roleTab, role === 'worker' && styles.roleTabActive]}
          onPress={() => {
            setRole('worker');
            setLocalError('');
          }}
        >
          <Ionicons
            name="briefcase"
            size={18}
            color={role === 'worker' ? '#FFFFFF' : Colors.mutedFg}
          />
          <Text style={[styles.roleTabText, role === 'worker' && styles.roleTabTextActive]}>
            Worker (Get Jobs)
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── WORKER PROFILE PHOTO SECTION (MANDATORY FOR WORKERS ONLY) ── */}
      {role === 'worker' && (
        <View style={styles.sectionCard}>
          <View style={styles.photoHeaderRow}>
            <Text style={styles.cardHeader}>Profile Picture *</Text>
            <View style={styles.mandatoryBadge}>
              <Text style={styles.mandatoryBadgeText}>Mandatory for Worker</Text>
            </View>
          </View>
          <Text style={styles.photoSubhead}>
            Clients require a clear face photo before hiring. Selfies or formal photos accepted.
          </Text>

          <View style={styles.photoUploadRow}>
            <View style={styles.photoPreviewWrapper}>
              {workerPhoto ? (
                <Image source={{ uri: workerPhoto }} style={styles.photoPreviewImg} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={32} color={Colors.mutedFg} />
                  <Text style={styles.photoPlaceholderText}>Upload Photo</Text>
                </View>
              )}
              {workerPhoto ? (
                <View style={styles.photoCheckCircle}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              ) : null}
            </View>

            <View style={styles.photoButtonsCol}>
              <TouchableOpacity
                style={styles.photoActionBtn}
                onPress={takeWorkerPhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={18} color={Colors.coral} />
                <Text style={styles.photoActionBtnText}>Take Live Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoActionBtn, styles.photoActionGallery]}
                onPress={pickWorkerPhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="images-outline" size={18} color={Colors.foreground} />
                <Text style={[styles.photoActionBtnText, { color: Colors.foreground }]}>
                  Choose from Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ── PERSONAL INFORMATION ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardHeader}>Personal Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={role === 'client' ? 'e.g. Pooja Sharma' : 'e.g. Ramesh Patil'}
            placeholderTextColor={Colors.mutedFg}
            style={styles.textInput}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address (Optional)</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. name@example.com"
            placeholderTextColor={Colors.mutedFg}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.textInput}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mobile Number (Verified)</Text>
          <View style={styles.verifiedPhoneRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.verifiedPhoneText}>+91 {session.phone || '9579196005'}</Text>
          </View>
        </View>
      </View>

      {/* ── AUTOMATIC GPS LOCATION & ADDRESS ── */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeader}>Location (Automatic GPS)</Text>
          <TouchableOpacity
            style={styles.gpsButton}
            activeOpacity={0.7}
            onPress={autoDetectGps}
            disabled={isGpsDetecting}
          >
            {isGpsDetecting ? (
              <ActivityIndicator size="small" color={Colors.coral} />
            ) : (
              <>
                <Ionicons name="navigate" size={14} color={Colors.coral} />
                <Text style={styles.gpsButtonText}>Re-detect GPS</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* GPS Status Banner */}
        <View style={styles.gpsBanner}>
          <Ionicons
            name={selectedAddress ? 'checkmark-circle' : 'locate-outline'}
            size={18}
            color={selectedAddress ? Colors.success : Colors.coral}
          />
          <Text style={styles.gpsBannerText}>
            {isGpsDetecting
              ? 'Detecting your real-time GPS location...'
              : selectedAddress
              ? 'GPS Location detected automatically'
              : 'Turn on GPS to auto-fill location'}
          </Text>
        </View>

        {/* Selected Address Display Card */}
        {selectedAddress && (
          <View style={styles.selectedAddressCard}>
            <View style={styles.selectedAddressHeader}>
              <View style={styles.pinCircle}>
                <Ionicons name="location" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.selectedAddressTitle}>Verified Location</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>GPS Verified</Text>
              </View>
            </View>

            <Text style={styles.selectedAddressDetail}>{selectedAddress.displayName}</Text>

            <View style={styles.coordRow}>
              {selectedAddress.city ? (
                <Text style={styles.coordBadge}>City: {selectedAddress.city}</Text>
              ) : null}
              {selectedAddress.state ? (
                <Text style={styles.coordBadge}>State: {selectedAddress.state}</Text>
              ) : null}
              {selectedAddress.postcode ? (
                <Text style={styles.coordBadge}>PIN: {selectedAddress.postcode}</Text>
              ) : null}
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Flat / House / Floor / Building No.</Text>
          <TextInput
            value={houseFlat}
            onChangeText={setHouseFlat}
            placeholder="e.g. Flat 402, Sunshine Towers"
            placeholderTextColor={Colors.mutedFg}
            style={styles.textInput}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nearby Landmark (Optional)</Text>
          <TextInput
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g. Near Ganpati Temple"
            placeholderTextColor={Colors.mutedFg}
            style={styles.textInput}
          />
        </View>

        {/* Optional Manual Search Fallback */}
        <View style={{ marginTop: 6 }}>
          <Text style={[styles.inputLabel, { color: Colors.mutedFg, fontSize: 12 }]}>
            Want to search another locality? (Optional)
          </Text>
          <View style={styles.searchBoxRow}>
            <Ionicons name="search" size={16} color={Colors.mutedFg} style={styles.searchIcon} />
            <TextInput
              value={addressSearch}
              onChangeText={setAddressSearch}
              placeholder="Search specific area..."
              placeholderTextColor={Colors.mutedFg}
              style={styles.searchInput}
            />
            {isSearchingMap && <ActivityIndicator size="small" color={Colors.coral} />}
          </View>
        </View>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            {searchResults.map((item, index) => (
              <TouchableOpacity
                key={`${item.lat}-${item.lon}-${index}`}
                style={styles.resultItem}
                onPress={() => handleSelectMapPlace(item)}
              >
                <Ionicons name="location-sharp" size={18} color={Colors.coral} />
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultTitle} numberOfLines={2}>
                    {item.displayName}
                  </Text>
                  <Text style={styles.resultSub}>
                    {item.city}, {item.state} {item.postcode ? `· PIN ${item.postcode}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ── WORKER PROFESSIONAL DETAILS (ONLY SHOWN FOR WORKER ROLE) ── */}
      {role === 'worker' && (
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeader}>Professional Work Experience</Text>

          <Text style={styles.inputLabel}>Primary Service Category *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPills}
          >
            {servicesList.map((cat) => (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                style={[
                  styles.categoryPill,
                  serviceCategory === cat && styles.categoryPillActive,
                ]}
                onPress={() => setServiceCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    serviceCategory === cat && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Years of Experience *</Text>
            <TextInput
              value={years}
              onChangeText={setYears}
              placeholder="e.g. 3"
              placeholderTextColor={Colors.mutedFg}
              keyboardType="number-pad"
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Work Experience & Background *</Text>
            <TextInput
              value={experienceDetails}
              onChangeText={setExperienceDetails}
              placeholder="Describe your previous work experience, households or projects you have served..."
              placeholderTextColor={Colors.mutedFg}
              multiline
              numberOfLines={4}
              style={[styles.textInput, styles.textArea]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Specialized Skills (Comma-separated) *</Text>
            <TextInput
              value={skills}
              onChangeText={setSkills}
              placeholder="e.g. Deep cleaning, Kitchen sanitization, Dusting"
              placeholderTextColor={Colors.mutedFg}
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Take-Home Hourly Pay (₹ / hr) *</Text>
            <TextInput
              value={ratePerHour}
              onChangeText={setRatePerHour}
              placeholder="e.g. 250 or 300"
              placeholderTextColor={Colors.mutedFg}
              keyboardType="number-pad"
              style={styles.textInput}
            />
            <Text style={styles.rateHintText}>
              Clients will pay this amount plus our standard platform safety fee.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Equipment & Supplies</Text>
            <TextInput
              value={equipment}
              onChangeText={setEquipment}
              placeholder="e.g. Personal toolkit, supplies, protective gear"
              placeholderTextColor={Colors.mutedFg}
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Languages Spoken</Text>
            <TextInput
              value={languages}
              onChangeText={setLanguages}
              placeholder="e.g. Hindi, Marathi, English"
              placeholderTextColor={Colors.mutedFg}
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Short Bio / Profile Summary</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Brief friendly message for clients..."
              placeholderTextColor={Colors.mutedFg}
              multiline
              numberOfLines={3}
              style={[styles.textInput, styles.textArea]}
            />
          </View>
        </View>
      )}

      {(localError || errorMessage) && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#DE350B" />
          <Text style={styles.errorText}>{localError || errorMessage}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator color={Colors.coral} size="large" />
        ) : (
          <GradientButton
            text={role === 'client' ? 'Save & Start Hiring →' : 'Complete Registration & View Requests →'}
            onPress={handleSubmit}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.foreground,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  subhead: {
    fontSize: 14,
    color: Colors.mutedFg,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 20,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDEFEF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    gap: 6,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  roleTabActive: {
    backgroundColor: Colors.foreground,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.mutedFg,
  },
  roleTabTextActive: {
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#ECECEC',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.foreground,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mandatoryBadge: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD6D6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mandatoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DE350B',
  },
  photoSubhead: {
    fontSize: 13,
    color: Colors.mutedFg,
    marginBottom: 14,
    lineHeight: 18,
  },
  photoUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  photoPreviewWrapper: {
    position: 'relative',
  },
  photoPreviewImg: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: Colors.mutedBg,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: Colors.mutedBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.mutedFg,
    marginTop: 4,
  },
  photoCheckCircle: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoButtonsCol: {
    flex: 1,
    gap: 8,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF0EB',
    paddingVertical: 10,
    borderRadius: 12,
  },
  photoActionGallery: {
    backgroundColor: '#F5F5F5',
  },
  photoActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.coral,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  gpsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.coral,
  },
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C8EADB',
  },
  gpsBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 6,
  },
  rateHintText: {
    fontSize: 11,
    color: Colors.mutedFg,
    marginTop: 4,
  },
  textInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  verifiedPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#F0F9F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#C8EADB',
  },
  verifiedPhoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.success,
  },
  searchBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.foreground,
    fontWeight: '500',
  },
  resultsContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
    maxHeight: 180,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 10,
  },
  resultTextCol: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.foreground,
  },
  resultSub: {
    fontSize: 11,
    color: Colors.mutedFg,
    marginTop: 2,
  },
  selectedAddressCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.coral,
    marginBottom: 14,
  },
  selectedAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAddressTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.foreground,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  selectedAddressDetail: {
    fontSize: 13,
    color: Colors.foreground,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  coordBadge: {
    fontSize: 11,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    color: Colors.mutedFg,
    borderWidth: 1,
    borderColor: Colors.border,
    fontWeight: '600',
  },
  categoryPills: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.mutedBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.peach,
    borderColor: Colors.coral,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.foreground,
  },
  categoryPillTextActive: {
    color: '#9A4C1A',
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  errorText: {
    color: '#DE350B',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  buttonContainer: {
    marginTop: 8,
  },
});
