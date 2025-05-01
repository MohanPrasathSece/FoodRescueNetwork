import React, { useState, useEffect } from 'react';
import { Box, Spinner, useToast, Button, VStack, HStack, Text, Badge, useDisclosure, useColorModeValue, IconButton, Flex, Heading, FormControl, FormLabel, Select, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, Stat, StatLabel, StatNumber, StatHelpText, Image, useColorModeValue, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, Link } from '@chakra-ui/react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const DonationMap = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [mapError, setMapError] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Filter states
  const [filters, setFilters] = useState({
    foodType: 'all',
    distance: 10, // km
    expiryTimeframe: 'all', // all, today, tomorrow, week
  });

  // Fetch available donations
  const fetchDonations = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/donations/available');
      setDonations(response.data);
    } catch (err) {
      setMapError('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

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
      
      // Refresh available donations list
      await fetchDonations();
      
      // Close the donation details and refresh the map
      setSelectedDonation(null);
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

  return (
    <Box p={4}>
      {mapError && <Box color="red.500" mb={4}>{mapError}</Box>}
      {loading ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner />
        </Flex>
      ) : (
        <VStack spacing={4} align="stretch">
          {donations.map((d) => {
            // Calculate hours until expiration
            const expirationDate = new Date(d.expirationDate);
            const hoursLeft = Math.max(Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60)), 0);
            return (
              <Box key={d._id} p={4} borderWidth="1px" borderRadius="md">
                <HStack justify="space-between">
                  <Text fontWeight="bold">{d.foodName}</Text>
                  <Badge colorScheme="green">{d.foodType}</Badge>
                </HStack>
                <Text>Quantity: {d.quantity} {d.unit}</Text>
                <Text>Expires in: {hoursLeft} hrs</Text>
                <Text>Pickup Location: {d.pickupAddress.addressLine || `${d.pickupAddress.lat}, ${d.pickupAddress.lng}`}</Text>
                {/* Map link via coordinates */}
                {d.pickupAddress.lat && d.pickupAddress.lng && (
                  <Link href={`https://www.google.com/maps?q=${d.pickupAddress.lat},${d.pickupAddress.lng}`} isExternal color="blue.500" fontSize="sm">
                    View on Map
                  </Link>
                )}
                <Button mt={2} size="sm" colorScheme="blue" onClick={() => handleRequestDonation(d._id)}>
                  Request
                </Button>
              </Box>
            );
          })}
        </VStack>
      )}
    </Box>
  );
};

export default DonationMap;
