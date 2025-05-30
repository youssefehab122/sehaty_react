import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { prescriptionAPI } from '../services/api';

const PrescriptionUpload = ({ onSuccess, onCancel }) => {
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [validUntil, setValidUntil] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState('');
  const [medicines, setMedicines] = useState([]);

  const validate = () => {
    const newErrors = {};
    if (!image) newErrors.image = 'Prescription image is required';
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!doctorName.trim()) newErrors.doctorName = 'Doctor name is required';
    if (!doctorSpecialty.trim()) newErrors.doctorSpecialty = 'Doctor specialty is required';
    if (!prescriptionText.trim()) newErrors.prescriptionText = 'Prescription text is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        setErrors((e) => ({ ...e, image: undefined }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        setErrors((e) => ({ ...e, image: undefined }));
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeImage = () => setImage(null);

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const formData = new FormData();

      // Append image with proper file object
      if (image) {
        // Get the file extension from the URI
        const uriParts = image.uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1];

        formData.append('image', {
          uri: image.uri,
          type: `image/${fileExtension}`,
          name: `prescription.${fileExtension}`
        });
      }

      // Append other fields
      formData.append('title', title);
      formData.append('doctorName', doctorName);
      formData.append('doctorSpecialty', doctorSpecialty);
      formData.append('validUntil', validUntil.toISOString());
      formData.append('prescriptionText', prescriptionText);
      formData.append('medicines', JSON.stringify(medicines));

      // Log form data for debugging
      console.log('Form data being sent:', {
        title,
        doctorName,
        doctorSpecialty,
        validUntil: validUntil.toISOString(),
        prescriptionText,
        medicines: JSON.stringify(medicines),
        image: image ? {
          uri: image.uri,
          type: image.type,
          name: image.fileName || `prescription.${fileExtension}`
        } : null
      });

      // Call the API to upload prescription
      console.log('Uploading prescription...');
      const response = await prescriptionAPI.uploadPrescription(formData);
      console.log('Upload response:', response);

      // Clear form
      setImage(null);
      setTitle('');
      setDoctorName('');
      setDoctorSpecialty('');
      setValidUntil(new Date());
      setPrescriptionText('');
      setMedicines([]);
      setErrors({});

      // Show success message
      Alert.alert('Success', 'Prescription uploaded successfully!');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Image Upload Section */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.image} />
            ) : (
              <View style={styles.placeholderImage}>
                <MaterialIcons name="add-photo-alternate" size={40} color="#ccc" />
                <Text style={styles.placeholderText}>Upload Prescription Image</Text>
              </View>
            )}
          </TouchableOpacity>
          {image && (
            <TouchableOpacity style={styles.removeImageBtn} onPress={removeImage}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cameraButton} onPress={pickImageFromCamera}>
            <MaterialIcons name="camera-alt" size={24} color="#1B794B" />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <MaterialIcons name="photo-library" size={24} color="#1B794B" />
            <Text style={styles.buttonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter prescription title"
              onBlur={validate}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Doctor Name</Text>
            <TextInput
              style={styles.input}
              value={doctorName}
              onChangeText={setDoctorName}
              placeholder="Enter doctor's name"
              onBlur={validate}
            />
            {errors.doctorName && <Text style={styles.errorText}>{errors.doctorName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Doctor Specialty</Text>
            <TextInput
              style={styles.input}
              value={doctorSpecialty}
              onChangeText={setDoctorSpecialty}
              placeholder="Enter doctor's specialty"
              onBlur={validate}
            />
            {errors.doctorSpecialty && <Text style={styles.errorText}>{errors.doctorSpecialty}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Valid Until</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {format(validUntil, 'MMM dd, yyyy')}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={validUntil}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setValidUntil(selectedDate);
              }}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Prescription Text</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={prescriptionText}
              onChangeText={setPrescriptionText}
              placeholder="Enter prescription text"
              multiline
              numberOfLines={4}
              onBlur={validate}
            />
            {errors.prescriptionText && <Text style={styles.errorText}>{errors.prescriptionText}</Text>}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Upload Prescription</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  imageSection: {
    position: 'relative',
    marginBottom: 10,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#D32F2F',
    borderRadius: 16,
    padding: 2,
    zIndex: 2,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cameraButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  galleryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonText: {
    marginLeft: 8,
    color: '#1B794B',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#1B794B',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default PrescriptionUpload; 