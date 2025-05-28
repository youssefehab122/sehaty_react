import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";

// Use different URLs for iOS and Android
const API_URL_LOCAL = Platform.select({
  ios: "https://sehaty.bright-ignite.com/api", // For iOS simulator
  android: "https://sehaty.bright-ignite.com/api", // For Android emulator
  default: "https://sehaty.bright-ignite.com/api",
});

// For physical devices, you'll need to use your computer's IP address
// const API_URL = 'http://YOUR_COMPUTER_IP:5050/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL_LOCAL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor to add auth token and handle errors
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("@auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Don't set Content-Type for FormData requests
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }

      console.log("API Request:", {
        url: config.url,
        method: config.method,
        headers: config.headers,
        data: config.data,
      });

      return config;
    } catch (error) {
      console.error("Request interceptor error:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Only clear token if it's not a login/register request
          if (
            !error.config.url.includes("/auth/login") &&
            !error.config.url.includes("/auth/register")
          ) {
            await AsyncStorage.removeItem("@auth_token");
            await AsyncStorage.removeItem("@refresh_token");
            await AsyncStorage.removeItem("@user");
            Alert.alert(
              "Session Expired",
              "Your session has expired. Please login again.",
              [{ text: "OK" }]
            );
          }
          break;
        case 403:
          Alert.alert(
            "Access Denied",
            "You do not have permission to perform this action.",
            [{ text: "OK" }]
          );
          break;
        case 404:
          Alert.alert("Not Found", "The requested resource was not found.", [
            { text: "OK" },
          ]);
          break;
        case 500:
          Alert.alert(
            "Server Error",
            "An unexpected error occurred. Please try again later.",
            [{ text: "OK" }]
          );
          break;
      }
    } else if (error.request) {
      // Network error
      Alert.alert(
        "Network Error",
        "Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.response?.data?.errors) {
    // Handle validation errors
    return {
      validationErrors: error.response.data.errors,
      message: "Validation failed",
    };
  }
  return {
    message:
      error.response?.data?.message || error.message || "An error occurred",
  };
};

export const authAPI = {
  /**
   * Login user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} User data and token
   */
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data.token) {
        await AsyncStorage.setItem("@auth_token", response.data.token);
        if (response.data.refresh_token) {
          await AsyncStorage.setItem(
            "@refresh_token",
            response.data.refresh_token
          );
        }
      }
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User data and token
   */
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      if (response.data.token) {
        await AsyncStorage.setItem("@auth_token", response.data.token);
        if (response.data.refresh_token) {
          await AsyncStorage.setItem(
            "@refresh_token",
            response.data.refresh_token
          );
        }
      }
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get user profile
   * @returns {Promise<Object>} User profile data
   */
  getProfile: async () => {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update user profile
   * @param {FormData} formData - Profile update data
   * @returns {Promise<Object>} Updated user data
   */
  updateProfile: async (formData) => {
    try {
      const response = await api.put("/auth/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      // Get the token before making the request
      const token = await AsyncStorage.getItem("@auth_token");

      if (!token) {
        // If no token exists, just clear storage and return
        await AsyncStorage.multiRemove([
          "@auth_token",
          "@refresh_token",
          "@user",
        ]);
        return { success: true, message: "Logged out successfully" };
      }

      // Make the logout request
      const response = await api.post("/auth/logout");

      // Clear all auth-related data
      await AsyncStorage.multiRemove([
        "@auth_token",
        "@refresh_token",
        "@user",
      ]);

      return response.data;
    } catch (error) {
      // Even if the API call fails, clear the local storage
      await AsyncStorage.multiRemove([
        "@auth_token",
        "@refresh_token",
        "@user",
      ]);
      throw handleApiError(error);
    }
  },

  /**
   * Request password reset
   * @param {string} email - User's email
   * @returns {Promise<Object>} Success message
   */
  forgotPassword: async (email) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} Success message
   */
  resetPassword: async (token, password) => {
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Verify OTP
   * @param {string} email - User's email
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} Verification result
   */
  verifyOtp: async (email, otp) => {
    try {
      const response = await api.post("/auth/verify-otp", { email, otp });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export const productsAPI = {
  /**
   * Get all products with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Products data
   */
  getProducts: async (params = {}) => {
    try {
      const response = await api.get("/medicines", { params });
      console.log("Products API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Products API Error:", error);
      throw handleApiError(error);
    }
  },

  /**
   * Search products by query
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  searchProducts: async (query) => {
    try {
      const response = await api.get("/medicines", {
        params: { search: query },
      });
      return response.data.medicines || [];
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Product data
   */
  getProductById: async (id) => {
    try {
      const response = await api.get(`/medicines/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get alternative medicines
   * @param {string} id - Product ID
   * @returns {Promise<Array>} Alternative medicines
   */
  getAlternatives: async (id) => {
    try {
      const response = await api.get(`/medicines/${id}/alternatives`);
      return response.data.alternatives || [];
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get all categories
   * @returns {Promise<Object>} Categories data
   */
  getCategories: async () => {
    try {
      const response = await api.get("/categories");
      console.log("Categories API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Categories API Error:", error);
      throw handleApiError(error);
    }
  },
};

export const pharmacyAPI = {
  /**
   * Get all pharmacies with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Pharmacies data
   */
  getPharmacies: async (params = {}) => {
    try {
      const response = await api.get("/pharmacies", { params });
      console.log("Pharmacies API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Pharmacies API Error:", error);
      throw handleApiError(error);
    }
  },

  /**
   * Get medicines for a specific pharmacy
   * @param {string} pharmacyId - ID of the pharmacy
   * @returns {Promise<Array>} List of medicines
   */
  getPharmacyMedicines: async (pharmacyId) => {
    try {
      const response = await api.get(`/pharmacies/${pharmacyId}/medicines`);
      return response.data.medicines || [];
    } catch (error) {
      console.error("Get pharmacy medicines error:", error);
      throw handleApiError(error);
    }
  },
};

export const cartAPI = {
  /**
   * Get user's cart
   * @returns {Promise<Object>} Cart data
   */
  getCart: async () => {
    try {
      const response = await api.get("/cart");
      return response.data;
    } catch (error) {
      console.error("Cart API Error:", error);
      throw handleApiError(error);
    }
  },

  /**
   * Add item to cart
   * @param {string} medicineId - ID of the medicine to add
   * @param {number} quantity - Quantity to add
   * @param {string} pharmacyId - ID of the pharmacy
   * @returns {Promise<Object>} Updated cart data
   */
  addToCart: async (medicineId, quantity, pharmacyId) => {
    try {
      // Validate parameters
      if (!medicineId || !pharmacyId) {
        throw new Error("Medicine ID and Pharmacy ID are required");
      }

      // Ensure medicineId is not a cart ID
      if (medicineId.length === 24 && medicineId.startsWith("682")) {
        console.warn(
          "Warning: medicineId might be a cart ID instead of a medicine ID"
        );
      }

      console.log("Cart API - Adding to cart:", {
        medicineId,
        quantity,
        pharmacyId,
      });

      const response = await api.post("/cart/items", {
        medicineId,
        quantity,
        pharmacyId,
      });

      console.log(
        "Cart API - Add to cart response:",
        JSON.stringify(response.data, null, 2)
      );

      // Validate response
      if (!response.data || !response.data.items) {
        throw new Error("Invalid cart response");
      }

      return response.data;
    } catch (error) {
      console.error("Add to Cart API Error:", error);
      throw handleApiError(error);
    }
  },

  /**
   * Update cart item quantity
   * @param {string} itemId - ID of the item to update
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Updated cart data
   */
  updateCartItem: async (itemId, quantity) => {
    try {
      const response = await api.put(`/cart/items/${itemId}`, { quantity });
      return response.data;
    } catch (error) {
      console.error("Update Cart API Error:", error);
      throw handleApiError(error);
    }
  },

  /**
   * Remove item from cart
   * @param {string} itemId - ID of the item to remove
   * @returns {Promise<Object>} Updated cart data
   */
  removeFromCart: async (medicineId,pharmacyId) => {
    try {
      const response = await api.delete(`/cart/items/${medicineId}/${pharmacyId}`);
      return response.data;
    } catch (error) {
      console.error("Remove from Cart API Error:", error);
      throw handleApiError(error);
    }
  },

  /**
   * Clear cart
   * @returns {Promise<Object>} Empty cart data
   */
  clearCart: async () => {
    try {
      const response = await api.delete("/cart");
      return response.data;
    } catch (error) {
      console.error("Clear Cart API Error:", error);
      throw handleApiError(error);
    }
  },

  /**
   * Create order from cart
   * @param {Object} orderData - Order data including address, items, payment method, etc.
   * @returns {Promise<Object>} Created order data
   */
  createOrder: async (orderData) => {
    try {
      const response = await api.post("/orders", orderData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  verifyPayment: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/verify-payment`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get order details
   * @param {string} orderId - ID of the order to fetch
   * @returns {Promise<Object>} Order details
   */
  getOrderDetails: async (orderId) => {
    try {
      // Get order details with populated medicine data
      const response = await api.get(
        `/orders/${orderId}?populate=items.medicineId`
      );
      console.log(
        "Order Details Response:",
        JSON.stringify(response.data, null, 2)
      );

      if (
        !response.data ||
        !response.data.order ||
        !response.data.order.items
      ) {
        throw new Error("Invalid order data received");
      }

      return response.data;
    } catch (error) {
      console.error("Get Order Details API Error:", error);
      throw handleApiError(error);
    }
  },

  /**
   * Get user's orders
   * @returns {Promise<Object>} Orders data
   */
  getOrders: async () => {
    try {
      const response = await api.get("/orders");
      console.log("Orders API Response:", response.data);

      // Ensure we return the orders array
      if (response.data && response.data.orders) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        return { orders: response.data };
      } else {
        console.error("Invalid orders response format:", response.data);
        return { orders: [] };
      }
    } catch (error) {
      console.error("Get Orders API Error:", error);
      throw handleApiError(error);
    }
  },
};

export const addressesAPI = {
  /**
   * Get all addresses for the current user
   * @returns {Promise<Array>} List of addresses
   */
  getAddresses: async () => {
    try {
      const response = await api.get("/addresses");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Add a new address
   * @param {Object} addressData - Address data including title, address, latitude, longitude
   * @returns {Promise<Object>} Created address
   */
  addAddress: async (addressData) => {
    try {
      const response = await api.post("/addresses", addressData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update an existing address
   * @param {string} id - Address ID
   * @param {Object} updates - Address updates
   * @returns {Promise<Object>} Updated address
   */
  updateAddress: async (id, updates) => {
    try {
      const response = await api.put(`/addresses/${id}`, updates);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Set an address as default
   * @param {string} id - Address ID
   * @returns {Promise<Object>} Updated address
   */
  setDefaultAddress: async (id) => {
    try {
      const response = await api.put(`/addresses/${id}/default`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Remove an address
   * @param {string} id - Address ID
   * @returns {Promise<void>}
   */
  removeAddress: async (id) => {
    try {
      await api.delete(`/addresses/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export const wishlistAPI = {
  /**
   * Get user's wishlist
   * @returns {Promise<Object>} Wishlist data
   */
  getWishlist: async () => {
    try {
      const response = await api.get("/wishlist");
      return response.data;
    } catch (error) {
      console.error("Wishlist API Error:", error);
      throw handleApiError(error);
    }
  },

  /**
   * Add item to wishlist
   * @param {string} medicineId - ID of the medicine to add
   * @returns {Promise<Object>} Updated wishlist data
   */
  addToWishlist: async (medicineId) => {
    try {
      const response = await api.post("/wishlist", { medicineId });
      return response.data;
    } catch (error) {
      console.error("Add to Wishlist API Error:", error);
      throw handleApiError(error);
    }
  },

  /**
   * Remove item from wishlist
   * @param {string} medicineId - ID of the medicine to remove
   * @returns {Promise<Object>} Updated wishlist data
   */
  removeFromWishlist: async (medicineId) => {
    try {
      const response = await api.delete(`/wishlist/${medicineId}`);
      return response.data;
    } catch (error) {
      console.error("Remove from Wishlist API Error:", error);
      throw handleApiError(error);
    }
  },
};

// User API
export const userAPI = {
  updateProfile: async (userData) => {
    try {
      const response = await api.put("/users/profile", userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updatePassword: async (passwordData) => {
    try {
      const response = await api.put("/users/password", passwordData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  uploadProfileImage: async (formData) => {
    try {
      const response = await api.post("/users/profile/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Prescription API
export const prescriptionAPI = {
  // Get all prescriptions for the current user
  getUserPrescriptions: async () => {
    try {
      console.log("Fetching user prescriptions...");
      const response = await api.get("/prescriptions/my-prescriptions");
      console.log("Prescriptions response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching prescriptions:",
        error.response?.data || error.message
      );
      throw handleApiError(error);
    }
  },

  // Get a single prescription by ID
  getPrescriptionById: async (prescriptionId) => {
    try {
      console.log("Fetching prescription:", prescriptionId);
      const response = await api.get(`/prescriptions/${prescriptionId}`);
      console.log("Prescription details:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error fetching prescription details:",
        error.response?.data || error.message
      );
      throw handleApiError(error);
    }
  },

  // Upload a new prescription
  uploadPrescription: async (formData) => {
    try {
      console.log("Uploading prescription...");
      const response = await api.post("/prescriptions/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Upload response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error uploading prescription:",
        error.response?.data || error.message
      );
      throw handleApiError(error);
    }
  },

  // Delete a prescription
  deletePrescription: async (prescriptionId) => {
    try {
      console.log("Deleting prescription:", prescriptionId);
      const response = await api.delete(`/prescriptions/${prescriptionId}`);
      console.log("Delete response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error deleting prescription:",
        error.response?.data || error.message
      );
      throw handleApiError(error);
    }
  },
};

// Reminder API functions
export const reminderAPI = {
  /**
   * Get reminders for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} List of reminders
   */
  getRemindersByDate: async (date) => {
    try {
      const response = await api.get(`/reminders/date/${date}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get a single reminder by ID
   * @param {string} id - Reminder ID
   * @returns {Promise<Object>} Reminder data
   */
  getReminderById: async (id) => {
    try {
      console.log("Fetching reminder by ID:", id);
      const response = await api.get(`/reminders/${id}`);
      console.log("Reminder data received:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching reminder:", error);
      throw handleApiError(error);
    }
  },

  /**
   * Create a new reminder
   * @param {Object} reminderData - Reminder data
   * @returns {Promise<Object>} Created reminder
   */
  createReminder: async (reminderData) => {
    try {
      const response = await api.post("/reminders", reminderData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Mark a reminder as taken
   * @param {string} id - Reminder ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} status - New status for the reminder
   * @returns {Promise<Object>} Updated reminder
   */
  markReminderAsTaken: async (id, date, status) => {
    try {
      const response = await api.post(`/reminders/${id}/mark-taken`, {
        date,
        status,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Delete a reminder
   * @param {string} id - Reminder ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  deleteReminder: async (id) => {
    try {
      const response = await api.delete(`/reminders/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update an existing reminder
   * @param {string} id - Reminder ID
   * @param {Object} reminderData - Updated reminder data
   * @returns {Promise<Object>} Updated reminder
   */
  updateReminder: async (id, reminderData) => {
    try {
      const response = await api.put(`/reminders/${id}`, reminderData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// ... rest of the API endpoints with similar error handling and documentation ...
