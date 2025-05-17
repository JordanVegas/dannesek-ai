import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

export const TypingDots = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return <Text>Typing{dots}</Text>;
};
