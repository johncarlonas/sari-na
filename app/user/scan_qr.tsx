import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Pressable, Animated, Easing } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const FRAME_SIZE = 250;
const CUTOUT_RADIUS = 14;

export default function ScanQrScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [screenRect, setScreenRect] = useState<Rect | null>(null);
  const [frameRect, setFrameRect] = useState<Rect | null>(null);
  const scanLineAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  useEffect(() => {
    if (scanned) {
      scanLineAnim.stopAnimation();
      return;
    }

    const loop = Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    scanLineAnim.setValue(0);
    loop.start();

    return () => {
      loop.stop();
    };
  }, [scanned, scanLineAnim]);

  const onScanSuccess = () => {
    router.replace({
      pathname: "/user/home",
      params: {
        location: "Room 5",
        detail: "Academic Building V, Floor 1",
      },
    });
  };

  const getBarcodeCenter = (result: BarcodeScanningResult): { x: number; y: number } | null => {
    if (Array.isArray(result.cornerPoints) && result.cornerPoints.length > 0) {
      const sum = result.cornerPoints.reduce(
        (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
        { x: 0, y: 0 }
      );
      return {
        x: sum.x / result.cornerPoints.length,
        y: sum.y / result.cornerPoints.length,
      };
    }

    if (result.bounds && "origin" in result.bounds && "size" in result.bounds) {
      return {
        x: result.bounds.origin.x + result.bounds.size.width / 2,
        y: result.bounds.origin.y + result.bounds.size.height / 2,
      };
    }

    return null;
  };

  const isInsideFrame = (point: { x: number; y: number }) => {
    if (!frameRect) return false;
    const padding = 10;
    return (
      point.x >= frameRect.x + padding &&
      point.x <= frameRect.x + frameRect.width - padding &&
      point.y >= frameRect.y + padding &&
      point.y <= frameRect.y + frameRect.height - padding
    );
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    const center = getBarcodeCenter(result);
    if (center && !isInsideFrame(center)) return;
    setScanned(true);
    onScanSuccess();
  };

  if (!permission) {
    return <View style={styles.loadingScreen} />;
  }

  if (!permission.granted) {
    return <View style={styles.loadingScreen} />;
  }

  return (
    <View
      style={styles.safeArea}
      onLayout={(event) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        setScreenRect({ x, y, width, height });
      }}
    >
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      <View pointerEvents="none" style={styles.overlayContainer}>
        {screenRect && frameRect ? (
          <>
            <View
              style={[
                styles.overlayBlock,
                {
                  top: 0,
                  left: 0,
                  right: 0,
                  height: frameRect.y,
                },
              ]}
            />
            <View
              style={[
                styles.overlayBlock,
                {
                  top: frameRect.y,
                  left: 0,
                  width: frameRect.x,
                  height: frameRect.height,
                },
              ]}
            />
            <View
              style={[
                styles.overlayBlock,
                {
                  top: frameRect.y,
                  left: frameRect.x + frameRect.width,
                  width: Math.max(0, screenRect.width - (frameRect.x + frameRect.width)),
                  height: frameRect.height,
                },
              ]}
            />
            <View
              style={[
                styles.overlayBlock,
                {
                  top: frameRect.y + frameRect.height,
                  left: 0,
                  right: 0,
                  height: Math.max(0, screenRect.height - (frameRect.y + frameRect.height)),
                },
              ]}
            />
            <View
              style={[
                styles.overlayCornerPatch,
                styles.overlayCornerTopLeft,
                {
                  top: frameRect.y,
                  left: frameRect.x,
                },
              ]}
            />
            <View
              style={[
                styles.overlayCornerPatch,
                styles.overlayCornerTopRight,
                {
                  top: frameRect.y,
                  left: frameRect.x + frameRect.width - CUTOUT_RADIUS,
                },
              ]}
            />
            <View
              style={[
                styles.overlayCornerPatch,
                styles.overlayCornerBottomLeft,
                {
                  top: frameRect.y + frameRect.height - CUTOUT_RADIUS,
                  left: frameRect.x,
                },
              ]}
            />
            <View
              style={[
                styles.overlayCornerPatch,
                styles.overlayCornerBottomRight,
                {
                  top: frameRect.y + frameRect.height - CUTOUT_RADIUS,
                  left: frameRect.x + frameRect.width - CUTOUT_RADIUS,
                },
              ]}
            />
          </>
        ) : (
          <View style={styles.overlayFallback} />
        )}
      </View>

      <View pointerEvents="box-none" style={styles.contentWrap}>
        <View
          style={styles.frameWrap}
          onLayout={(event) => {
            const { x, y, width, height } = event.nativeEvent.layout;
            setFrameRect({ x, y, width, height });
          }}
        >
          <Animated.View
            style={[
              styles.scanLineHalo,
              {
                transform: [
                  {
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, FRAME_SIZE - 20],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.scanLineAura,
              {
                transform: [
                  {
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, FRAME_SIZE - 20],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.scanLineGlow,
              {
                transform: [
                  {
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, FRAME_SIZE - 20],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, FRAME_SIZE - 20],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.frameCornerTopLeft} />
          <View style={styles.frameCornerTopRight} />
          <View style={styles.frameCornerBottomLeft} />
          <View style={styles.frameCornerBottomRight} />
        </View>

        <View style={[styles.card, { backgroundColor: '#edf2f8' }]}> 
          <Text style={[styles.cardTitle, { color: '#002A7A' }]}>Align QR code within the frame</Text>
          <Text style={[styles.cardSub, { color: '#002A7A' }]}>QR codes are located at room entrances and hallway pillars</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayBlock: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  overlayCornerPatch: {
    position: "absolute",
    width: CUTOUT_RADIUS,
    height: CUTOUT_RADIUS,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  overlayCornerTopLeft: {
    borderBottomRightRadius: CUTOUT_RADIUS,
  },
  overlayCornerTopRight: {
    borderBottomLeftRadius: CUTOUT_RADIUS,
  },
  overlayCornerBottomLeft: {
    borderTopRightRadius: CUTOUT_RADIUS,
  },
  overlayCornerBottomRight: {
    borderTopLeftRadius: CUTOUT_RADIUS,
  },
  overlayFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  contentWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  frameWrap: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: "relative",
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    opacity: 1,
    shadowColor: "#FFFFFF",
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  scanLineHalo: {
    position: "absolute",
    top: -11,
    left: 0,
    right: 0,
    height: 24,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    opacity: 0.08,
  },
  scanLineAura: {
    position: "absolute",
    top: -6,
    left: 0,
    right: 0,
    height: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    opacity: 0.16,
  },
  scanLineGlow: {
    position: "absolute",
    top: -3,
    left: 0,
    right: 0,
    height: 7,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    opacity: 0.32,
  },
  frameCornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 36,
    height: 36,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#fff",
    borderTopLeftRadius: 12,
  },
  frameCornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#fff",
    borderTopRightRadius: 12,
  },
  frameCornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 36,
    height: 36,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#fff",
    borderBottomLeftRadius: 12,
  },
  frameCornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#fff",
    borderBottomRightRadius: 12,
  },
  card: {
    marginTop: 28,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  cardTitle: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 18,
  },
  cardSub: {
    color: "#e8f2ff",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
});
