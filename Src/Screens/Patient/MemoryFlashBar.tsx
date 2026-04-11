import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Images } from '../../constants/images';

type Memory = {
  id: string;
  text: string;
  image?: ImageSourcePropType | string;
};

const SAMPLE_MEMORIES: Memory[] = [
  { id: '1', text: 'This is your daughter Ananya', image: Images.doctor },
  { id: '2', text: 'You visited Goa last summer', image: Images.doctor2 },
  { id: '3', text: 'Your best friend is Rahul', image: Images.doctor3 },
];

export default function MemoryFlashBar() {
  const [memoryIndex, setMemoryIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryIndex(prev => (prev + 1) % SAMPLE_MEMORIES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const memory = SAMPLE_MEMORIES[memoryIndex];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {memory.image ? (
          <Image
            source={
              typeof memory.image === 'string'
                ? { uri: memory.image }
                : memory.image
            }
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.textWrap}>
          <Text style={styles.label}>Memory Reminder</Text>
          <Text style={styles.text}>{memory.text}</Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#F4F1EC' },

  container: {
    marginHorizontal: 18,    
    padding: 14,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 18,
    marginRight: 12,
  },

  placeholder: {
    width: 60,
    height: 60,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },

  textWrap: { flex: 1 },

  label: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '600',
     fontFamily: 'Coolvetica-Bold',
   
  },

  
  text: {
  fontSize: 20,
  color: '#1F2937',
  lineHeight: 22,
  fontFamily: 'Coolvetica-Bold',
}
});
