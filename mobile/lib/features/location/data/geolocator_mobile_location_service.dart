import 'package:geolocator/geolocator.dart';

import '../application/mobile_location_controller.dart';

class GeolocatorMobileLocationService implements MobileLocationService {
  const GeolocatorMobileLocationService();

  @override
  Future<MobileLocationCaptureResult> captureCurrentLocation() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return const MobileLocationCaptureResult(
        status: MobileLocationStatus.serviceDisabled,
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      return const MobileLocationCaptureResult(
        status: MobileLocationStatus.denied,
      );
    }

    if (permission == LocationPermission.deniedForever) {
      return const MobileLocationCaptureResult(
        status: MobileLocationStatus.restricted,
      );
    }

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.reduced,
          timeLimit: Duration(seconds: 8),
        ),
      );
      return MobileLocationCaptureResult(
        status: MobileLocationStatus.allowed,
        reading: MobileLocationReading(
          latitude: position.latitude,
          longitude: position.longitude,
          accuracyMeters: position.accuracy,
        ),
      );
    } catch (_) {
      return const MobileLocationCaptureResult(
        status: MobileLocationStatus.unavailable,
      );
    }
  }
}
