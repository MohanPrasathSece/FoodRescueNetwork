import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  HStack,
  Text,
  Image,
  useToast,
  Heading,
  Divider,
  FormErrorMessage,
  InputGroup,
  InputRightAddon,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const DonationForm = ({ onDonationComplete }) => {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    foodName: '',
    foodType: 'produce',
    description: '',
    quantity: 1,
    unit: 'kg',
    expirationDate: '',
    expirationTime: '',
    pickupAddress: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zipCode || ''
    },
    pickupInstructions: '',
    imageFile: null
  });
  
  const [errors, setErrors] = useState({});
  
  // Get user's location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);
  
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationLoading(false);
          setLocationError('');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your current location. Please try again or enter your address manually.');
          setLocationLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const handleNumberChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File too large',
          description: 'Image must be less than 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      if (!file.type.match('image.*')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setFormData({
        ...formData,
        imageFile: file
      });
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      if (errors.imageFile) {
        setErrors({
          ...errors,
          imageFile: ''
        });
      }
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.foodName.trim()) newErrors.foodName = 'Food name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (!formData.expirationDate) newErrors.expirationDate = 'Expiration date is required';
    
    // Address validation
    if (!formData.pickupAddress.street.trim()) newErrors['pickupAddress.street'] = 'Street is required';
    if (!formData.pickupAddress.city.trim()) newErrors['pickupAddress.city'] = 'City is required';
    if (!formData.pickupAddress.state.trim()) newErrors['pickupAddress.state'] = 'State is required';
    if (!formData.pickupAddress.zipCode.trim()) newErrors['pickupAddress.zipCode'] = 'ZIP code is required';
    
    // Image validation
    if (!formData.imageFile && !imagePreview) newErrors.imageFile = 'Please upload an image of the food';
    
    // Location validation
    if (!userLocation) newErrors.location = 'Location data is required. Please enable location access.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create form data for file upload
      const donationData = new FormData();
      donationData.append('foodName', formData.foodName);
      donationData.append('foodType', formData.foodType);
      donationData.append('description', formData.description);
      donationData.append('quantity', formData.quantity);
      donationData.append('unit', formData.unit);
      
      // Combine date and time for expiration
      const expirationDateTime = formData.expirationTime 
        ? `${formData.expirationDate}T${formData.expirationTime}` 
        : `${formData.expirationDate}T23:59:59`;
      donationData.append('expirationDate', expirationDateTime);
      
      // Add address
      donationData.append('pickupAddress', JSON.stringify(formData.pickupAddress));
      donationData.append('pickupInstructions', formData.pickupInstructions);
      
      // Add location data
      if (userLocation) {
        donationData.append('location', JSON.stringify({
          type: 'Point',
          coordinates: [userLocation.lng, userLocation.lat] // GeoJSON format: [longitude, latitude]
        }));
      }
      
      // Add image if available
      if (formData.imageFile) {
        donationData.append('image', formData.imageFile);
      }
      
      // Send to server
      const response = await axios.post('/api/donations', donationData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast({
        title: 'Donation Created',
        description: 'Your food donation has been successfully listed',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setFormData({
        foodName: '',
        foodType: 'produce',
        description: '',
        quantity: 1,
        unit: 'kg',
        expirationDate: '',
        expirationTime: '',
        pickupAddress: {
          street: user?.address?.street || '',
          city: user?.address?.city || '',
          state: user?.address?.state || '',
          zipCode: user?.address?.zipCode || ''
        },
        pickupInstructions: '',
        imageFile: null
      });
      setImagePreview(null);
      
      // Notify parent component
      if (onDonationComplete) {
        onDonationComplete(response.data);
      }
    } catch (error) {
      console.error('Error creating donation:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create donation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      bg={bgColor}
      p={6}
      borderRadius="lg"
      boxShadow="md"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <Heading size="lg" mb={6}>Donate Food</Heading>
      
      <VStack spacing={6} align="stretch">
        {/* Food Image Upload */}
        <FormControl isRequired isInvalid={errors.imageFile}>
          <FormLabel>Food Image</FormLabel>
          <Box
            borderWidth={2}
            borderStyle="dashed"
            borderRadius="md"
            p={4}
            textAlign="center"
            borderColor={errors.imageFile ? "red.500" : "gray.300"}
            _hover={{ borderColor: "green.500" }}
            cursor="pointer"
            onClick={() => fileInputRef.current.click()}
          >
            {imagePreview ? (
              <VStack spacing={3}>
                <Image 
                  src={imagePreview} 
                  alt="Food preview" 
                  maxH="200px" 
                  borderRadius="md"
                />
                <Button size="sm" colorScheme="green" onClick={() => fileInputRef.current.click()}>
                  Change Image
                </Button>
              </VStack>
            ) : (
              <VStack spacing={3}>
                <Text>Click to upload an image of the food</Text>
                <Text fontSize="sm" color="gray.500">
                  (Max size: 5MB)
                </Text>
              </VStack>
            )}
            <Input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              display="none"
            />
          </Box>
          <FormErrorMessage>{errors.imageFile}</FormErrorMessage>
        </FormControl>
        
        <Divider />
        
        {/* Food Details */}
        <Heading size="md">Food Details</Heading>
        
        <FormControl isRequired isInvalid={errors.foodName}>
          <FormLabel>Food Name</FormLabel>
          <Input
            name="foodName"
            value={formData.foodName}
            onChange={handleInputChange}
            placeholder="E.g., Fresh Vegetables, Cooked Pasta"
          />
          <FormErrorMessage>{errors.foodName}</FormErrorMessage>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Food Type</FormLabel>
          <Select
            name="foodType"
            value={formData.foodType}
            onChange={handleInputChange}
          >
            <option value="produce">Fresh Produce</option>
            <option value="prepared">Prepared Food</option>
            <option value="packaged">Packaged Food</option>
          </Select>
        </FormControl>
        
        <FormControl isRequired isInvalid={errors.description}>
          <FormLabel>Description</FormLabel>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe the food, including any allergens or dietary information"
            rows={3}
          />
          <FormErrorMessage>{errors.description}</FormErrorMessage>
        </FormControl>
        
        <HStack spacing={4}>
          <FormControl isRequired isInvalid={errors.quantity}>
            <FormLabel>Quantity</FormLabel>
            <NumberInput
              min={1}
              value={formData.quantity}
              onChange={(value) => handleNumberChange('quantity', value)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormErrorMessage>{errors.quantity}</FormErrorMessage>
          </FormControl>
          
          <FormControl>
            <FormLabel>Unit</FormLabel>
            <Select
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="g">Grams (g)</option>
              <option value="lb">Pounds (lb)</option>
              <option value="oz">Ounces (oz)</option>
              <option value="l">Liters (L)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="servings">Servings</option>
              <option value="items">Items</option>
            </Select>
          </FormControl>
        </HStack>
        
        <HStack spacing={4}>
          <FormControl isRequired isInvalid={errors.expirationDate}>
            <FormLabel>Expiration Date</FormLabel>
            <Input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]} // Today's date as minimum
            />
            <FormErrorMessage>{errors.expirationDate}</FormErrorMessage>
          </FormControl>
          
          <FormControl>
            <FormLabel>Expiration Time (Optional)</FormLabel>
            <Input
              type="time"
              name="expirationTime"
              value={formData.expirationTime}
              onChange={handleInputChange}
            />
          </FormControl>
        </HStack>
        
        <Divider />
        
        {/* Location Information */}
        <Heading size="md">Pickup Location</Heading>
        
        <FormControl isInvalid={errors.location}>
          <FormLabel>Geolocation</FormLabel>
          <HStack>
            <Button
              onClick={getCurrentLocation}
              colorScheme="blue"
              isLoading={locationLoading}
              leftIcon={<span>📍</span>}
              size="sm"
            >
              {userLocation ? 'Update Location' : 'Get My Location'}
            </Button>
            
            {userLocation && (
              <Text color="green.500" fontSize="sm">
                ✓ Location captured
              </Text>
            )}
          </HStack>
          {locationError && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {locationError}
            </Text>
          )}
          <FormErrorMessage>{errors.location}</FormErrorMessage>
        </FormControl>
        
        <FormControl isRequired isInvalid={errors['pickupAddress.street']}>
          <FormLabel>Street Address</FormLabel>
          <Input
            name="pickupAddress.street"
            value={formData.pickupAddress.street}
            onChange={handleInputChange}
            placeholder="Street address"
          />
          <FormErrorMessage>{errors['pickupAddress.street']}</FormErrorMessage>
        </FormControl>
        
        <HStack spacing={4}>
          <FormControl isRequired isInvalid={errors['pickupAddress.city']}>
            <FormLabel>City</FormLabel>
            <Input
              name="pickupAddress.city"
              value={formData.pickupAddress.city}
              onChange={handleInputChange}
              placeholder="City"
            />
            <FormErrorMessage>{errors['pickupAddress.city']}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={errors['pickupAddress.state']}>
            <FormLabel>State</FormLabel>
            <Input
              name="pickupAddress.state"
              value={formData.pickupAddress.state}
              onChange={handleInputChange}
              placeholder="State"
            />
            <FormErrorMessage>{errors['pickupAddress.state']}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={errors['pickupAddress.zipCode']}>
            <FormLabel>ZIP Code</FormLabel>
            <Input
              name="pickupAddress.zipCode"
              value={formData.pickupAddress.zipCode}
              onChange={handleInputChange}
              placeholder="ZIP Code"
            />
            <FormErrorMessage>{errors['pickupAddress.zipCode']}</FormErrorMessage>
          </FormControl>
        </HStack>
        
        <FormControl>
          <FormLabel>Pickup Instructions (Optional)</FormLabel>
          <Textarea
            name="pickupInstructions"
            value={formData.pickupInstructions}
            onChange={handleInputChange}
            placeholder="Any special instructions for pickup (e.g., 'Ring doorbell', 'Call when arriving')"
            rows={2}
          />
        </FormControl>
        
        <Button
          mt={4}
          colorScheme="green"
          type="submit"
          size="lg"
          isLoading={loading}
          loadingText="Creating Donation"
          isFullWidth
        >
          Create Donation
        </Button>
      </VStack>
    </Box>
  );
};

export default DonationForm;
