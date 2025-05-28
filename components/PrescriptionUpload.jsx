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

const PrescriptionUpload = ({ onSubmit, onCancel, loading }) => {
  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [validUntil, setValidUntil] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSubmit = () => {
    if (!image) {
      Alert.alert('Error', 'Please select a prescription image');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!doctorName.trim()) {
      Alert.alert('Error', 'Please enter doctor name');
      return;
    }
    if (!doctorSpecialty.trim()) {
      Alert.alert('Error', 'Please enter doctor specialty');
      return;
    }

    const formData = new FormData();
    formData.append('image', {
      uri: image,
      type: 'image/jpeg',
      name: 'prescription.jpg',
    });
    formData.append('title', title);
    formData.append('doctorName', doctorName);
    formData.append('doctorSpecialty', doctorSpecialty);
    formData.append('validUntil', validUntil.toISOString());

    onSubmit(formData);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Image Upload Section */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={pickImage}
        >
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.image}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialIcons name="add-photo-alternate" size={40} color="#ccc" />
              <Text style={styles.placeholderText}>Upload Prescription Image</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter prescription title"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Doctor Name</Text>
            <TextInput
              style={styles.input}
              value={doctorName}
              onChangeText={setDoctorName}
              placeholder="Enter doctor's name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Doctor Specialty</Text>
            <TextInput
              style={styles.input}
              value={doctorSpecialty}
              onChangeText={setDoctorSpecialty}
              placeholder="Enter doctor's specialty"
            />
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
                if (selectedDate) {
                  setValidUntil(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}
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
});

export default PrescriptionUpload; 