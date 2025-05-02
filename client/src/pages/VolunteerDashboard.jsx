import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Text,
  Stack,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Link,
  Image,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

// set base URL for axios after imports
axios.defaults.baseURL = 'http://localhost:5000';

export default function VolunteerDashboard() {
  // color mode values
  const pageBg = useColorModeValue('gray.50','gray.800');
  const containerBg = useColorModeValue('white','gray.700');
  const cardBg = useColorModeValue('white','gray.600');
  const textColor = useColorModeValue('gray.800','whiteAlpha.900');
  const historySectionBg = useColorModeValue('gray.100','gray.700');
  const historyCardBg = useColorModeValue('white','gray.600');
  const [availableDonations, setAvailableDonations] = useState([]);
  const [historyDonations, setHistoryDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchAvailableDonations();
    fetchHistoryDonations();
  }, []);

  const fetchAvailableDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/donations/available', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableDonations(response.data);
    } catch (error) {
      console.error('Error fetching available donations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch donations',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchHistoryDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/donations/user/history', { headers: { Authorization: `Bearer ${token}` }});
      setHistoryDonations(response.data);
    } catch (error) {
      console.error('Error fetching donation history:', error.response?.data?.message || error.message);
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to fetch donation history', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handlePickupRequest = async (donation) => {
    setSelectedDonation(donation);
    onOpen();
  };

  const confirmPickup = async () => {
    try {
      const token = localStorage.getItem('token');
      const pickupTime = new Date().toISOString();
      await axios.patch(
        `/api/donations/${selectedDonation._id}/claim`,
        { pickupTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: 'Success',
        description: 'Donation claimed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      fetchAvailableDonations();
      fetchHistoryDonations();
    } catch (error) {
      console.error('Error claiming donation:', error.response?.data?.message || error.message);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to claim donation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Mark a pickup as completed
  const handleCompletePickup = async (pickupId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/pickups/${pickupId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Success', description: 'Pickup completed', status: 'success', duration: 3000, isClosable: true });
      fetchHistoryDonations();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to pick up donation', status: 'error', duration: 3000, isClosable: true });
    }
  };

  // Add delivered handler
  const handleDelivered = async (donationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/donations/${donationId}/delivered`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Delivered', description: 'Donation marked as delivered.', status: 'success', duration: 3000, isClosable: true });
      fetchAvailableDonations();
      fetchHistoryDonations();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to mark as delivered', status: 'error', duration: 3000, isClosable: true });
    }
  };

  // Add not delivered handler
  const handleNotDelivered = async (donationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/donations/${donationId}/expired`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Expired', description: 'Donation marked as not delivered (expired).', status: 'warning', duration: 3000, isClosable: true });
      fetchAvailableDonations();
      fetchHistoryDonations();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to mark as expired', status: 'error', duration: 3000, isClosable: true });
    }
  };

  return (
    <Box
      py={10}
      bgImage={`linear-gradient(rgba(255,255,255,0.75),rgba(255,255,255,0.75)), url('https://1.bp.blogspot.com/-hGztsaeIFhY/Wi046IYRhwI/AAAAAAAAAJ0/fkZLk1ZSqCcBYLbaWy8WUGzrLlOlOXFgQCPcBGAYYCw/s1600/DSC_0097.JPG')`}
      bgBlendMode="overlay"
      bgSize="cover"
      bgPosition="center"
      color={textColor}
      minH="100vh"
    >
      <Container maxW="6xl" bg={containerBg} p={6} rounded="xl" boxShadow="2xl">
        <Stack spacing={8}>
          {/* Available Donations */}
          <Box bg={cardBg} p={4} borderRadius="md" boxShadow="sm">
            <Heading size="lg" mb={5}>Available Donations</Heading>
            {availableDonations.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                {availableDonations.filter(d => d.status !== 'claimed').map((donation) => (
                  <Card key={donation._id} p={4} boxShadow="md" _hover={{ transform: 'translateY(-4px)' }} transition="0.2s">
                    <CardHeader><Heading size="sm">{donation.foodName}</Heading></CardHeader>
                    <CardBody>
                      <Image src={`http://localhost:5000${donation.imageUrl}`} alt={donation.foodName} boxSize="150px" objectFit="cover" mb={3} />
                      <Box p={3}>
                        <Text fontSize="sm" noOfLines={2}>{donation.description}</Text>
                      </Box>
                      <Box height="200px" mb={4}>
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          src={`https://www.google.com/maps?q=${encodeURIComponent(`${donation.pickupAddress.street}, ${donation.pickupAddress.city}, ${donation.pickupAddress.state} ${donation.pickupAddress.zipCode}`)}&output=embed`}
                        />
                      </Box>
                      <Text fontSize="sm" color="gray.700"><strong>Expires On:</strong> {new Date(donation.expirationDate).toLocaleString()}</Text>
                      <Text fontSize="sm" color="gray.700"><strong>Pickup Address:</strong> {donation.pickupAddress?.street}, {donation.pickupAddress?.city}, {donation.pickupAddress?.state} {donation.pickupAddress?.zipCode}</Text>
                    </CardBody>
                    <CardFooter>
                      <Button colorScheme="blue" onClick={() => handlePickupRequest(donation)}>Claim</Button>
                    </CardFooter>
                  </Card>
                ))}
              </SimpleGrid>
            ) : (
              <Text>No donations available at the moment. Please check back soon.</Text>
            )}
          </Box>

          {/* Claimed by Me */}
          {historyDonations.filter(d => d.status === 'claimed').length > 0 && (
            <Box bg="green.50" p={4} borderRadius="md" boxShadow="sm">
              <Heading size="md" mb={4} color="green.700">Pending Delivery</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                {historyDonations.filter(d => d.status === 'claimed').map((donation) => (
                  <Card key={donation._id} p={4} boxShadow="md" _hover={{ transform: 'translateY(-4px)' }} transition="0.2s">
                    <CardHeader><Heading size="sm">{donation.foodName}</Heading></CardHeader>
                    <CardBody>
                      <Image src={`http://localhost:5000${donation.imageUrl}`} alt={donation.foodName} boxSize="150px" objectFit="cover" mb={3} />
                      <Box p={3}>
                        <Text fontSize="sm" noOfLines={2}>{donation.description}</Text>
                      </Box>
                      <Box height="200px" mb={4}>
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          src={`https://www.google.com/maps?q=${encodeURIComponent(`${donation.pickupAddress.street}, ${donation.pickupAddress.city}, ${donation.pickupAddress.state} ${donation.pickupAddress.zipCode}`)}&output=embed`}
                        />
                      </Box>
                      <Text fontSize="sm" color="gray.700"><strong>Expires On:</strong> {new Date(donation.expirationDate).toLocaleString()}</Text>
                      <Text fontSize="sm" color="gray.700"><strong>Pickup Address:</strong> {donation.pickupAddress?.street}, {donation.pickupAddress?.city}, {donation.pickupAddress?.state} {donation.pickupAddress?.zipCode}</Text>
                    </CardBody>
                    <CardFooter>
                      <Button colorScheme="green" mr={2} onClick={() => handleDelivered(donation._id)}>Delivered</Button>
                      <Button colorScheme="red" variant="outline" onClick={() => handleNotDelivered(donation._id)}>Not Delivered</Button>
                    </CardFooter>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </Stack>
      </Container>

      {/* Claim Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Pickup Request</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to claim this donation?</Text>
            {selectedDonation && (
              <Box mt={4}>
                <Text><strong>Food Name:</strong> {selectedDonation.foodName}</Text>
                <Text><strong>Quantity:</strong> {selectedDonation.quantity} {selectedDonation.unit}</Text>
                <Text><strong>Address:</strong> {selectedDonation.pickupAddress?.street}, {selectedDonation.pickupAddress?.city}, {selectedDonation.pickupAddress?.state} {selectedDonation.pickupAddress?.zipCode}</Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" mr={3} onClick={confirmPickup}>
              Confirm
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}