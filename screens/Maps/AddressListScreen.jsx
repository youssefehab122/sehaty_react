import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAddresses,
  addAddress,
  removeAddress,
  setDefaultAddress,
  setSelectedAddress,
} from "../../store/slices/addressSlice";

export default function AddressListScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const addresses = useSelector((state) => state.address.items);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAddresses();
  }, []);

  // Listen for new address from ChooseAddress screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const newAddress = route.params?.newAddress;
      if (newAddress) {
        dispatch(addAddress(newAddress));
        // Clear the param to prevent duplicate adds
        navigation.setParams({ newAddress: null });
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  const loadAddresses = async () => {
    try {
      await dispatch(fetchAddresses());
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = () => {
    navigation.navigate('Map', { useCallback: true });
  };

  const handleSelectAddress = (address) => {
    if (route.params?.onAddressSelect) {
      route.params.onAddressSelect(address);
    } else {
      dispatch(setSelectedAddress(address));
      navigation.goBack();
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await dispatch(setDefaultAddress(id));
    } catch (error) {
      console.error("Error setting default address:", error);
      Alert.alert("Error", "Failed to set default address");
    }
  };

  const handleDeleteAddress = async (id) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(removeAddress(id));
            } catch (error) {
              console.error("Error deleting address:", error);
              Alert.alert("Error", "Failed to delete address");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B794B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#606060" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id || item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.addressCard}
            onPress={() => handleSelectAddress(item)}
          >
            <View style={styles.addressHeader}>
              <View style={styles.titleContainer}>
                <MaterialIcons name="location-on" size={24} color="#1B794B" />
                <Text style={styles.addressTitle}>{item.title}</Text>
                {item.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <View style={styles.actions}>
                {!item.isDefault && (
                  <TouchableOpacity
                    onPress={() => handleSetDefault(item._id || item.id)}
                    style={styles.actionButton}
                  >
                    <MaterialIcons name="star-border" size={24} color="#1B794B" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleDeleteAddress(item._id || item.id)}
                  style={styles.actionButton}
                >
                  <MaterialIcons name="delete-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.addressText}>{item.address}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="location-off" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>No addresses found</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddAddress}
      >
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add New Address</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#E8F5E9",
  },
  backButton: {
    width: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1B794B",
    textAlign: "center",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  addressCard: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: "#1B794B",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#606060",
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: "#1B794B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
