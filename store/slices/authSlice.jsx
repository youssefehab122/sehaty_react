// store/slices/authSlice.jsx
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../../services/api";
import { setSelectedAddress } from "./addressSlice";
import { handleValidationError, getErrorMessage } from "../../utils/validationErrorHandler";
import axios from 'axios';
import { Platform } from 'react-native';

// Use different URLs for development and production
const API_URL ="https://52f6-196-158-202-163.ngrok-free.app/api";

// Add axios interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    return Promise.reject(error);
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password, remember }, { rejectWithValue }) => {
    try {
      console.log('Login attempt:', { email, remember });
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
        remember
      });

      console.log('Login response:', response.data);

      // Save token and user data to AsyncStorage
      if (response.data.token) {
        await AsyncStorage.setItem("@auth_token", response.data.token);
        if (response.data.refresh_token) {
          await AsyncStorage.setItem("@refresh_token", response.data.refresh_token);
        }
        if (response.data.user) {
          await AsyncStorage.setItem("@user", JSON.stringify(response.data.user));
        }
      }

      return response.data;
    } catch (error) {
      console.log('Error response:', JSON.stringify(error, null, 2));
      console.log('Error response2:', JSON.stringify(error.response, null, 2));
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Handle validation errors
      if (error.response?.data?.errors) {
        return rejectWithValue({
          validationErrors: error.response.data.errors
        });
      }

      // Handle other errors
      if (error.response) {
        return rejectWithValue({
          message: error.response.data?.message || 'Login failed',
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        return rejectWithValue({
          message: 'No response from server. Please check your internet connection.',
          request: error.request
        });
      } else {
        return rejectWithValue({
          message: error.message,
          error: error
        });
      }
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Register request data:', userData);
      
      // Don't set Content-Type header for FormData
      const config = userData instanceof FormData ? {
        headers: {
          'Accept': 'application/json',
        }
      } : {};
      
      const response = await axios.post(`${API_URL}/auth/register`, userData, config);
      console.log('Register response:', response.data);
      
      if (response.data.token) {
        await AsyncStorage.setItem('@auth_token', response.data.token);
        if (response.data.refresh_token) {
          await AsyncStorage.setItem('@refresh_token', response.data.refresh_token);
        }
        if (response.data.user) {
          await AsyncStorage.setItem('@user', JSON.stringify(response.data.user));
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const validationErrors = handleValidationError(error);
      if (validationErrors) {
        return rejectWithValue({ validationErrors });
      }
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email: '',
        password,
        token
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem("@auth_token");
      if (!token) {
        return null;
      }
      
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        await AsyncStorage.setItem("@user", JSON.stringify(response.data));
        return {
          user: response.data,
          token: token
        };
      }
      return null;
    } catch (error) {
      // Only clear tokens if it's an authentication error
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove([
          "@auth_token",
          "@refresh_token",
          "@user"
        ]);
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to load user');
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      // Call logout API
      const token = await AsyncStorage.getItem("@auth_token");
      await axios.post(
        `${API_URL}/auth/logout`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Clear all local storage
      await AsyncStorage.multiRemove([
        "@auth_token",
        "@refresh_token",
        "@user",
        "@cart",
        "@wishlist",
        "@selected_address"
      ]);

      return null;
    } catch (error) {
      // Even if API fails, clear all local storage
      await AsyncStorage.multiRemove([
        "@auth_token",
        "@refresh_token",
        "@user",
        "@cart",
        "@wishlist",
        "@selected_address"
      ]);

      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem("@auth_token");
      const response = await axios.put(
        `${API_URL}/auth/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Update user data in AsyncStorage
      if (response.data.data) {
        await AsyncStorage.setItem("@user", JSON.stringify(response.data.data));
      }

      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error.response?.data?.errors) {
        return rejectWithValue({
          validationErrors: error.response.data.errors
        });
      }

      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    isLoading: false,
    error: null,
    validationErrors: null,
    isAuthenticated: false,
    forgotPasswordSuccess: false,
    resetPasswordSuccess: false,
    verifyOtpSuccess: false,
    registerSuccess: false,
    loginSuccess: false,
    changePasswordSuccess: false,
    logoutSuccess: false,
  },
  reducers: {
    clearAuthState: (state) => {
      state.error = null;
      state.validationErrors = null;
      state.forgotPasswordSuccess = false;
      state.resetPasswordSuccess = false;
      state.verifyOtpSuccess = false;
      state.registerSuccess = false;
      state.loginSuccess = false;
      state.changePasswordSuccess = false;
      state.logoutSuccess = false;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = !!action.payload.user;
    },
    clearValidationErrors: (state) => {
      state.validationErrors = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.validationErrors = null;
        state.loginSuccess = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoading = false;
        state.isAuthenticated = true;
        state.error = null;
        state.validationErrors = null;
        state.loginSuccess = true;
      })
      .addCase(login.rejected, (state, action) => {
        if (action.payload?.validationErrors) {
          state.validationErrors = action.payload.validationErrors;
        } else {
          state.error = action.payload;
        }
        state.isLoading = false;
        state.isAuthenticated = false;
        state.loginSuccess = false;
      })

      // Register cases
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.validationErrors = null;
        state.registerSuccess = false;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoading = false;
        state.registerSuccess = true;
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(register.rejected, (state, action) => {
        if (action.payload?.validationErrors) {
          state.validationErrors = action.payload.validationErrors;
        } else {
          state.error = action.payload;
        }
        state.isLoading = false;
        state.registerSuccess = false;
      })

      // Forgot password cases
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.forgotPasswordSuccess = false;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.forgotPasswordSuccess = true;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
        state.forgotPasswordSuccess = false;
      })

      // Reset password cases
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.resetPasswordSuccess = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.resetPasswordSuccess = true;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
        state.resetPasswordSuccess = false;
      })

      // Verify OTP cases
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.verifyOtpSuccess = false;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.verifyOtpSuccess = true;
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.error = action.payload;
        state.isLoading = false;
        state.verifyOtpSuccess = false;
      })

      // Load user cases
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = action.payload?.user || null;
        state.token = action.payload?.token || null;
        state.isLoading = false;
        state.isAuthenticated = !!action.payload?.user;
      })
      .addCase(loadUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      })

      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.logoutSuccess = true;
      })

      // Update profile cases
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.data;
        state.isLoading = false;
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        if (action.payload?.validationErrors) {
          state.validationErrors = action.payload.validationErrors;
        } else {
          state.error = action.payload;
        }
        state.isLoading = false;
      });
  },
});

export const { clearAuthState, clearValidationErrors, setCredentials } = authSlice.actions;
export default authSlice.reducer;
