import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>
        ✅ App Loaded Successfully
      </Text>
      <Text style={{ fontSize: 16, marginTop: 10, color: '#666' }}>
        Minimal test build working
      </Text>
    </View>
  );
}