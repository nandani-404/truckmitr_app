import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@truckmitr/redux/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const UploadProgressBar: React.FC = () => {
  const { isUploading, progress, status, postMetadata } = useSelector((state: RootState) => state.upload);
  const widthAnim = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  if (!isUploading && status !== 'error' && status !== 'success') {
    return null;
  }

  if (status === 'success' || status === 'idle') return null;

  const getStatusText = () => {
    switch (status) {
      case 'compressing': return 'Compressing Media...';
      case 'uploading': return `Uploading... ${Math.round(progress)}%`;
      case 'error': return 'Upload Failed';
      default: return 'Processing...';
    }
  };

  const barColor = status === 'error' ? '#EF4444' : '#056CE2';

  return (
    <View style={[styles.container, { top: insets.top }]}>
      <View style={styles.info}>
        <Text style={styles.text}>{getStatusText()}</Text>
        {postMetadata?.caption && (
          <Text style={styles.caption} numberOfLines={1}>
            {postMetadata.caption}
          </Text>
        )}
      </View>
      <View style={styles.progressTrack}>
        <Animated.View 
          style={[
            styles.progressBar, 
            { 
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp'
              }),
              backgroundColor: barColor
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9998,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 8,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  caption: {
    fontSize: 10,
    color: '#6B7280',
    flex: 1,
    marginLeft: 12,
    textAlign: 'right',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});

export default UploadProgressBar;
