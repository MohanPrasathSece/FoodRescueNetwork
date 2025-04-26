import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  Spinner,
  useToast,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  FormControl,
  FormLabel,
  Select,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Image,
  useDisclosure,
  useColorModeValue,
  IconButton,
} from '@chakra-ui/react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// We'll use Google Maps API for the map interface
// This component assumes you've added the Google Maps script in index.html
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>

const DonationMap = () => {
  const { user } = useAuth();
  const toast = useToast();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapError, setMapError] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    foodType: 'all',
    distance: 10, // km
    expiryTimeframe: 'all', // all, today, tomorrow, week
  });
  
  // Initialize map when component mounts
  useEffect(() => {
    initializeMap();
  }, []);
  
  // Fetch donations when user location is available or filters change
  useEffect(() => {
    if (userLocation) {
      fetchDonations();
    }
  }, [userLocation, filters]);
  
  const initializeMap = () => {
    // Check if Google Maps is loaded
    if (!window.google || !window.google.maps) {
      setMapError('Google Maps failed to load. Please refresh the page.');
      setLoading(false);
      return;
    }
    
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          
          // Initialize the map
          const mapOptions = {
            center: userPos,
            zoom: 12,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          };
          
          const map = new window.google.maps.Map(mapRef.current, mapOptions);
          mapInstanceRef.current = map;
          
          // Add marker for user's location
          new window.google.maps.Marker({
            position: userPos,
            map: map,
            title: 'Your Location',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(40, 40)
            }
          });
          
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setMapError('Unable to get your location. Please enable location services and refresh.');
          
          // Initialize map with default location (city center)
          const defaultPos = { lat: 40.7128, lng: -74.0060 }; // New York as default
          setUserLocation(defaultPos);
          
          const map = new window.google.maps.Map(mapRef.current, {
            center: defaultPos,
            zoom: 12
          });
          mapInstanceRef.current = map;
          
          setLoading(false);
        }
      );
    } else {
      setMapError('Geolocation is not supported by your browser');
      setLoading(false);
    }
  };
  
  const fetchDonations = async () => {
    try {
      setLoading(true);
      
      // Build query parameters based on filters
      const params = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        distance: filters.distance,
      };
      
      if (filters.foodType !== 'all') {
        params.foodType = filters.foodType;
      }
      
      if (filters.expiryTimeframe !== 'all') {
        params.expiryTimeframe = filters.expiryTimeframe;
      }
      
      const response = await axios.get('/api/donations/nearby', { params });
      setDonations(response.data);
      
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      // Add markers for each donation
      response.data.forEach(donation => {
        if (donation.location && donation.location.coordinates) {
          const [lng, lat] = donation.location.coordinates;
          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            title: donation.foodName,
            animation: window.google.maps.Animation.DROP
          });
          
          // Add click listener to marker
          marker.addListener('click', () => {
            setSelectedDonation(donation);
          });
          
          markersRef.current.push(marker);
        }
      });
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch nearby donations',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const handleRequestDonation = async (donationId) => {
    try {
      setLoading(true);
      await axios.post(`/api/donations/${donationId}/request`);
      
      toast({
        title: 'Request Sent',
        description: 'Your request has been sent to the donor',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Close the donation details and refresh the map
      setSelectedDonation(null);
      fetchDonations();
    } catch (error) {
      console.error('Error requesting donation:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance.toFixed(1);
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };
  
  // Format expiration date
  const formatExpiryDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise return the full date
    return date.toLocaleString([], { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get food type badge color
  const getFoodTypeBadgeColor = (foodType) => {
    switch (foodType) {
      case 'produce': return 'green';
      case 'prepared': return 'orange';
      case 'packaged': return 'blue';
      default: return 'gray';
    }
  };
  
  // Format food type for display
  const formatFoodType = (type) => {
    switch (type) {
      case 'produce': return 'Fresh Produce';
      case 'prepared': return 'Prepared Food';
      case 'packaged': return 'Packaged Food';
      default: return type;
    }
  };
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Box position="relative" height="calc(100vh - 80px)" width="100%">
      {/* Filter Button */}
      <Button
        position="absolute"
        top={4}
        right={4}
        zIndex={10}
        colorScheme="blue"
        onClick={onOpen}
        size="md"
        boxShadow="md"
      >
        Filters
      </Button>
      
      {/* Map Container */}
      <Box
        ref={mapRef}
        height="100%"
        width="100%"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="base"
      />
      
      {/* Loading Indicator */}
      {loading && (
        <Flex
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="rgba(255, 255, 255, 0.8)"
          p={4}
          borderRadius="md"
          alignItems="center"
          zIndex={5}
        >
          <Spinner mr={3} />
          <Text>Loading...</Text>
        </Flex>
      )}
      
      {/* Error Message */}
      {mapError && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="red.500"
          color="white"
          p={4}
          borderRadius="md"
          maxW="80%"
          textAlign="center"
          zIndex={5}
        >
          <Text>{mapError}</Text>
          <Button mt={2} onClick={initializeMap} size="sm">
            Retry
          </Button>
        </Box>
      )}
      
      {/* Filter Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filter Donations</DrawerHeader>
          
          <DrawerBody>
            <VStack spacing={6} align="stretch">
              <FormControl>
                <FormLabel>Food Type</FormLabel>
                <Select
                  value={filters.foodType}
                  onChange={(e) => handleFilterChange('foodType', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="produce">Fresh Produce</option>
                  <option value="prepared">Prepared Food</option>
                  <option value="packaged">Packaged Food</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Distance (km): {filters.distance}</FormLabel>
                <RangeSlider
                  defaultValue={[filters.distance]}
                  min={1}
                  max={50}
                  step={1}
                  onChange={([value]) => handleFilterChange('distance', value)}
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                </RangeSlider>
                <Flex justify="space-between">
                  <Text fontSize="xs">1 km</Text>
                  <Text fontSize="xs">50 km</Text>
                </Flex>
              </FormControl>
              
              <FormControl>
                <FormLabel>Expiry Timeframe</FormLabel>
                <Select
                  value={filters.expiryTimeframe}
                  onChange={(e) => handleFilterChange('expiryTimeframe', e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="today">Expires Today</option>
                  <option value="tomorrow">Expires Tomorrow</option>
                  <option value="week">Expires This Week</option>
                </Select>
              </FormControl>
              
              <Button colorScheme="blue" onClick={() => {
                onClose();
                fetchDonations();
              }}>
                Apply Filters
              </Button>
              
              <Button variant="outline" onClick={() => {
                setFilters({
                  foodType: 'all',
                  distance: 10,
                  expiryTimeframe: 'all',
                });
              }}>
                Reset Filters
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      
      {/* Selected Donation Details */}
      {selectedDonation && (
        <Box
          position="absolute"
          bottom={4}
          left="50%"
          transform="translateX(-50%)"
          width="90%"
          maxW="500px"
          bg={bgColor}
          p={4}
          borderRadius="lg"
          boxShadow="xl"
          zIndex={5}
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Flex justify="space-between" align="center" mb={2}>
            <Heading size="md">{selectedDonation.foodName}</Heading>
            <IconButton
              aria-label="Close"
              icon={<span>✕</span>}
              size="sm"
              variant="ghost"
              onClick={() => setSelectedDonation(null)}
            />
          </Flex>
          
          <HStack spacing={2} mb={3}>
            <Badge colorScheme={getFoodTypeBadgeColor(selectedDonation.foodType)}>
              {formatFoodType(selectedDonation.foodType)}
            </Badge>
            
            {userLocation && selectedDonation.location && (
              <Badge colorScheme="purple">
                {calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  selectedDonation.location.coordinates[1],
                  selectedDonation.location.coordinates[0]
                )} km away
              </Badge>
            )}
          </HStack>
          
          <Flex mb={4}>
            {selectedDonation.imageUrl && (
              <Image
                src={selectedDonation.imageUrl}
                alt={selectedDonation.foodName}
                boxSize="100px"
                objectFit="cover"
                borderRadius="md"
                mr={4}
                fallbackSrc="https://via.placeholder.com/100?text=Food"
              />
            )}
            
            <VStack align="start" flex={1}>
              <Text fontSize="sm">{selectedDonation.description}</Text>
              <HStack>
                <Stat size="sm">
                  <StatLabel fontSize="xs">Quantity</StatLabel>
                  <StatNumber fontSize="md">{selectedDonation.quantity} {selectedDonation.unit}</StatNumber>
                </Stat>
                
                <Stat size="sm">
                  <StatLabel fontSize="xs">Expires</StatLabel>
                  <StatNumber fontSize="md">{formatExpiryDate(selectedDonation.expirationDate)}</StatNumber>
                </Stat>
              </HStack>
            </VStack>
          </Flex>
          
          <Button
            colorScheme="green"
            width="100%"
            onClick={() => handleRequestDonation(selectedDonation._id)}
            isLoading={loading}
          >
            Request This Food
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DonationMap;
