import type {ImageSourcePropType} from 'react-native';
import {
  Brush, ChefHat, Zap, Wrench, Hammer, HandHelping, Utensils, HeartPulse, Car, Truck, Leaf, Sparkles, Wind, Refrigerator, Flame,
} from 'lucide-react-native';

/** Images are kept out of the pure domain module so booking rules stay unit-testable without native assets. */
export const photos: Record<string, ImageSourcePropType> = {
  sunita: require('../assets/sunita.jpg'),
  rahul: require('../assets/rahul.jpg'),
};

export const serviceIcons: Record<string, typeof Brush> = {
  Cleaning: Brush, Cooking: ChefHat, Plumbing: Wrench, Electrical: Zap, Carpentry: Hammer, 'General Help': HandHelping,
  'Service Staff': Utensils, Nurse: HeartPulse, Driver: Car, Delivery: Truck, Gardening: Leaf, Beauty: Sparkles,
  'AC Service': Wind, 'Appliance Repair': Refrigerator, Welding: Flame,
};
