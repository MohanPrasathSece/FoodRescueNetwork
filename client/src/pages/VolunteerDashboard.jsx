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
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export default function VolunteerDashboard() {
  const [availableDonations, setAvailableDonations] = useState([]);
  const [myPickups, setMyPickups] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchAvailableDonations();
    fetchMyPickups();
  }, []);

  const fetchAvailableDonations = async () => {
    try {
      // Use the public, auth-free route for available donations
      const response = await axios.get('http://localhost:5000/api/donations/available');
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

  const fetchMyPickups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/pickups/my-pickups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyPickups(response.data);
    } catch (error) {
      // If route not found, assume no pickups yet
      if (error.response?.status === 404) {
        setMyPickups([]);
        return;
      }
      console.error('Error fetching my pickups:', error.response?.data?.message || error.message);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch your pickups',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
        `http://localhost:5000/api/donations/${selectedDonation._id}/claim`,
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
      fetchMyPickups();
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
        `http://localhost:5000/api/pickups/${pickupId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Success', description: 'Pickup completed', status: 'success', duration: 3000, isClosable: true });
      fetchMyPickups();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to pick up donation', status: 'error', duration: 3000, isClosable: true });
    }
  };

  // Determine history pickups (claimed/completed, cancelled, or expired)
  const now = new Date();
  const historyPickups = myPickups.filter(
    p => new Date(p.donation.expirationDate) <= now || ['completed', 'cancelled'].includes(p.status)
  );

  return (
    <Box bg="gray.100" minH="100vh" py={10}>
      <Container maxW="container.lg" bg="white" p={6} borderRadius="md" boxShadow="lg">
        <Stack spacing={8}>
          <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
            <Heading size="lg" mb={5}>Available Donations</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
              {availableDonations.map((donation) => (
                <Card key={donation._id} borderRadius="md" boxShadow="md" _hover={{ boxShadow: 'xl', transform: 'translateY(-2px)' }} transition="0.2s">
                  <CardHeader>
                    <Heading size="md">{donation.foodName}</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={3}>
                      <Text>{donation.description}</Text>
                      <Text><strong>Quantity:</strong> {donation.quantity} {donation.unit}</Text>
                      {(() => {
                        const exp = new Date(donation.expirationDate);
                        const hrs = Math.max(Math.ceil((exp - new Date()) / (1000*60*60)), 0);
                        return <Text><strong>Expires in:</strong> {hrs} hrs</Text>;
                      })()}
                      <Text fontSize="sm" color="gray.600"><strong>Expires On:</strong> {new Date(donation.expirationDate).toLocaleDateString()}</Text>
                      <Text><strong>Pickup Address:</strong> {donation.pickupAddress?.street}, {donation.pickupAddress?.city}, {donation.pickupAddress?.state} {donation.pickupAddress?.zipCode}</Text>
                      {donation.pickupAddress && (() => {
                        const addr = `${donation.pickupAddress.street}, ${donation.pickupAddress.city}, ${donation.pickupAddress.state} ${donation.pickupAddress.zipCode}`;
                        const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(addr)}`;
                        return (
                          <Link href={mapUrl} isExternal _hover={{ textDecoration: 'none' }}>
                            <Box cursor="pointer" mt="1rem">
                              <iframe
                                title="pickup-location"
                                src={`${mapUrl}&hl=en&z=15&output=embed`}
                                width="100%"
                                height="200"
                                style={{ border: 0 }}
                                loading="lazy"
                              />
                            </Box>
                          </Link>
                        );
                      })()}
                      {donation.imageUrl && <img src={donation.imageUrl} alt="Food" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />}
                      <Badge colorScheme="green" alignSelf="start">
                        Available
                      </Badge>
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Button colorScheme="green" onClick={() => handlePickupRequest(donation)}>
                      Claim Donation
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </SimpleGrid>
            {availableDonations.length === 0 && <Text>No donations available at the moment</Text>}
          </Box>

          {/* History Sections */}
          <Box mt={8} p={4} borderRadius="md" boxShadow="sm" bg="gray.50">
            <Heading size="lg" mb={4} color="gray.600">Pickup History</Heading>
            {/* Picked Up */}
            <Box mb={6} p={4} bg="green.100" borderRadius="md">
              <Heading size="md" mb={3} color="green.700">Picked Up</Heading>
              {historyPickups.filter(p => p.status === 'completed').length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                  {historyPickups.filter(p => p.status === 'completed').map(p => {
                    const d = p.donation;
                    const date = new Date(p.updatedAt).toLocaleDateString();
                    return (
                      <Card key={p._id} p={4} boxShadow="md" _hover={{ transform: 'translateY(-4px)' }} transition="0.2s">
                        <CardHeader><Heading size="sm">{d.foodName}</Heading></CardHeader>
                        <CardBody>
                          <Image src={d.imageUrl} alt={d.foodName} boxSize="150px" objectFit="cover" mb={3} />
                          <Text mb={2}>{d.description}</Text>
                          <Text fontSize="sm" color="gray.700"><strong>Picked Up On:</strong> {date}</Text>
                        </CardBody>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              ) : <Text color="gray.600">No pickups completed yet.</Text>}
            </Box>
            {/* Expired */}
            <Box p={4} bg="red.100" borderRadius="md">
              <Heading size="md" mb={3} color="red.700">Expired</Heading>
              {historyPickups.filter(p => p.status !== 'completed').length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                  {historyPickups.filter(p => p.status !== 'completed').map(p => {
                    const d = p.donation;
                    const date = new Date(d.expirationDate).toLocaleDateString();
                    return (
                      <Card key={p._id} p={4} boxShadow="md" _hover={{ transform: 'translateY(-4px)' }} transition="0.2s">
                        <CardHeader><Heading size="sm">{d.foodName}</Heading></CardHeader>
                        <CardBody>
                          <Image src={d.imageUrl} alt={d.foodName} boxSize="150px" objectFit="cover" mb={3} />
                          <Text mb={2}>{d.description}</Text>
                          <Text fontSize="sm" color="gray.700"><strong>Expired On:</strong> {date}</Text>
                        </CardBody>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              ) : <Text color="gray.600">No expired pickups.</Text>}
            </Box>
          </Box>

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
                    {/* Map removed: displaying address only */}
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
        </Stack>
      </Container>
    </Box>
  );
}