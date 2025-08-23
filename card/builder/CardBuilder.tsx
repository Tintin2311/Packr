import React from 'react';
import { View } from 'react-native';
import ProfileCard from '../cards/ProfileCard';

export default function CardBuilder() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#0a0f14' }}>
      <ProfileCard />
    </View>
  );
}
