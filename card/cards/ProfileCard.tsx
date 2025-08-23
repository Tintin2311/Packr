import React from 'react';
import { View, Text } from 'react-native';

export default function ProfileCard() {
  return (
    <View style={{ padding: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
      <Text style={{ color: 'white', fontWeight: '700' }}>ProfileCard</Text>
      <Text style={{ color: 'rgba(255,255,255,0.7)' }}>À brancher avec la theme & le builder.</Text>
    </View>
  );
}
