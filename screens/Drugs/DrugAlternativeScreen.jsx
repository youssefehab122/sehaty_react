import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { addToCart } from "../../store/slices/cartSlice";
import { SafeAreaView } from "react-native-safe-area-context";
import { productsAPI } from "../../services/api";

export default function DrugAlternativeScreen({ navigation, route }) {
  console.log('DrugAlternativeScreen - Initial Render');
  console.log('Route Params:', JSON.stringify(route.params, null, 2));

  const dispatch = useDispatch();
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('none');

  useEffect(() => {
    console.log('DrugAlternativeScreen - useEffect triggered');
    if (!route.params?.medicine) {
      console.log('No medicine provided in route params');
      setError('No medicine selected');
      setLoading(false);
      return;
    }
    console.log('Medicine from route params:', JSON.stringify(route.params.medicine, null, 2));
    fetchAlternatives();
  }, [route.params?.medicine?._id]);

  const fetchAlternatives = async () => {
    console.log('Fetching alternatives for medicine:', route.params.medicine._id);
    try {
      setLoading(true);
      console.log('Making API call to getAlternatives...');
      const response = await productsAPI.getAlternatives(route.params.medicine._id);
      console.log('API Response:', JSON.stringify(response, null, 2));
      
      // Handle both array and object responses
      const alternatives = Array.isArray(response) ? response : response?.alternatives || [];
      const source = response?.source || 'activeIngredient';

      console.log('Setting alternatives:', alternatives.length);
      setAlternatives(alternatives);
      console.log('Setting source:', source);
      setSource(source);
    } catch (err) {
      console.error('Error in fetchAlternatives:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response?.data
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    console.log('handleAddToCart called for item:', JSON.stringify(item, null, 2));
    if (!item.pharmacyInfo) {
      console.warn('No pharmacy info available for item');
      Alert.alert('Error', 'This medicine is not available in any pharmacy');
      return;
    }
    console.log('Dispatching addToCart action');
    dispatch(addToCart({
      ...item,
      quantity: 1
    }));
    Alert.alert('Success', 'Medicine added to cart successfully!');
  };

  const renderAlternativeItem = (item) => {
    console.log('Rendering alternative item:', JSON.stringify(item, null, 2));
    return (
      <View key={item._id} style={styles.alternativeCard}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.medicineImage}
          resizeMode="contain"
          onError={(e) => console.error('Image loading error:', e.nativeEvent.error)}
        />
        
        <View style={styles.medicineInfo}>
          <Text style={styles.medicineName}>{item.name}</Text>
          <Text style={styles.medicineDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.pharmacyInfo}>
            <Ionicons name="business-outline" size={16} color="#1B794B" />
            <Text style={styles.pharmacyName} numberOfLines={1}>
              {item.pharmacyInfo?.pharmacyName || 'Not available in any pharmacy'}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>EGP {item.pharmacyInfo?.price || item.price}</Text>
            {item.pharmacyInfo?.discount > 0 && (
              <Text style={styles.discount}>{item.pharmacyInfo.discount}% OFF</Text>
            )}
          </View>

          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(item)}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    console.log('Rendering loading state');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B794B" />
      </View>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        {route.params?.medicine && (
          <TouchableOpacity style={styles.retryButton} onPress={fetchAlternatives}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.retryButton, { marginTop: 10 }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('Rendering main content with alternatives:', alternatives.length);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1B794B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alternative Medicines</Text>
      </View>

      <View style={styles.sourceContainer}>
        <Text style={styles.sourceText}>
          {source === 'predefined' 
            ? 'Recommended alternatives'
            : source === 'activeIngredient'
            ? 'Similar medicines with the same active ingredient'
            : 'No alternatives found'}
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {alternatives.length > 0 ? (
          alternatives.map(renderAlternativeItem)
        ) : (
          <View style={styles.noAlternativesContainer}>
            <Text style={styles.noAlternativesText}>
              No alternative medicines found
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B794B',
  },
  sourceContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  sourceText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  alternativeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicineImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  medicineInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  medicineDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  pharmacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pharmacyName: {
    fontSize: 14,
    color: '#1B794B',
    marginLeft: 4,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B794B',
    marginRight: 8,
  },
  discount: {
    fontSize: 14,
    color: '#E53935',
    fontWeight: '600',
  },
  addToCartButton: {
    backgroundColor: '#1B794B',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1B794B',
    padding: 10,
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noAlternativesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noAlternativesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
