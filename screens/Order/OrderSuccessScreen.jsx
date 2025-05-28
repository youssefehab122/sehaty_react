import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

const OrderSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, total = 0, paymentMethod, paymentUrl, paymentCompleted } = route.params || {};

useEffect(() => {
  const handleDeepLink = (event) => {
    if (event.url.includes('payment-complete')) {
      const orderIdFromUrl = event.url.split('/').pop();
      if (orderIdFromUrl === orderId) {
        // Payment completed successfully
        navigation.replace("OrderSuccessScreen", {
          orderId,
          total,
          paymentMethod,
          paymentCompleted: true
        });
      }
    }
  };

  // Add event listener
  Linking.addEventListener('url', handleDeepLink);

  // Clean up
  return () => {
    Linking.removeEventListener('url', handleDeepLink);
  };
}, [orderId, paymentMethod, total]);
  const handleTrackOrder = () => {
    navigation.navigate('OrderTracking', { orderId });
  };

  const handleViewOrders = () => {
    navigation.navigate('MainTabs', { screen: 'Orders' });
  };

  const handleContinueShopping = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  // For Paymob payments, show different messaging
  const isPaymobPending = paymentMethod === 'paymob' && !paymentUrl;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {isPaymobPending ? (
            <Ionicons name="time-outline" size={80} color="#FFA000" />
          ) : (
            <Ionicons name="checkmark-circle" size={80} color="#1B794B" />
          )}
        </View>

        <Text style={styles.title}>
          {isPaymobPending ? 'Payment Processing' : 'Order Placed Successfully!'}
        </Text>
        
        <Text style={styles.subtitle}>
          {isPaymobPending
            ? 'Your payment is being processed. We will notify you when it is confirmed.'
            : 'Thank you for your order. We\'ll notify you when it\'s ready.'}
        </Text>

        <View style={styles.orderDetails}>
          <Text style={styles.orderId}>Order #{orderId}</Text>
          <Text style={styles.amount}>EGP {total.toFixed(2)}</Text>
          <Text style={styles.paymentMethod}>
            {isPaymobPending ? 'Processing via Paymob' : `Paid via ${paymentMethod}`}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {!isPaymobPending && (
            <>
              <TouchableOpacity
                style={[styles.button, styles.trackButton]}
                onPress={handleTrackOrder}
              >
                <Text style={styles.buttonText}>Track Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.ordersButton]}
                onPress={handleViewOrders}
              >
                <Text style={styles.buttonText}>View Orders</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.button, styles.shopButton]}
            onPress={handleContinueShopping}
          >
            <Text style={styles.buttonText}>
              {isPaymobPending ? 'Back to Home' : 'Continue Shopping'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B794B',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  orderDetails: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B794B',
    marginBottom: 5,
  },
  paymentMethod: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackButton: {
    backgroundColor: '#1B794B',
  },
  ordersButton: {
    backgroundColor: '#1976D2',
  },
  shopButton: {
    backgroundColor: '#FFA000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OrderSuccessScreen;

