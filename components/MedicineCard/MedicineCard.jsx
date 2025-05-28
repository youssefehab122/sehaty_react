import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { HeartIcon } from 'react-native-heroicons/outline';
import { HeartIcon as HeartSolidIcon } from 'react-native-heroicons/solid';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { useNavigation } from '@react-navigation/native';

const MedicineCard = ({ medicine }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const wishlist = useSelector((state) => state.wishlist.items);
  const isInWishlist = wishlist.some((item) => item._id === medicine._id);

  const handleWishlistToggle = async () => {
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(medicine._id)).unwrap();
      } else {
        await dispatch(addToWishlist(medicine._id)).unwrap();
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert(error.message || 'Failed to update wishlist');
    }
  };

  const handleAddToCart = () => {
    console.log("addToCart => ", JSON.stringify(medicine, null, 2));
    let addToCartItems = {
      quantity:1,
      medicineId: medicine._id,
      pharmacyId: medicine.pharmacyInfo.pharmacyId
    }
    dispatch(addToCart(addToCartItems));
    Alert.alert('Success', 'Medicine added to cart successfully!', [
      { text: 'OK', onPress: () => console.log('OK Pressed') }
    ]);
  };

  const handlePress = () => {
    navigation.navigate('Product', { product: medicine });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: medicine.image }} style={styles.image} />
        <TouchableOpacity 
          style={styles.wishlistButton} 
          onPress={handleWishlistToggle}
        >
          {isInWishlist ? (
            <HeartSolidIcon size={24} color="#FF4B4B" />
          ) : (
            <HeartIcon size={24} color="#FF4B4B" />
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>{medicine.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{medicine.description}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>EGP {medicine.price}</Text>
          {medicine.originalPrice && (
            <Text style={styles.originalPrice}>EGP {medicine.originalPrice}</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  details: {
    padding: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1F2937',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B794B',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    backgroundColor: '#1B794B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MedicineCard; 