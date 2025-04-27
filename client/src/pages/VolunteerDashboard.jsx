import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import axios from 'axios';
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
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/donations?status=available', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableDonations(response.data);
    } catch (error) {
      console.error('Error fetching available donations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch available donations',
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
      console.error('Error fetching my pickups:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your pickups',
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
      await axios.post(`http://localhost:5000/api/donations/${selectedDonation._id}/claim`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      toast({
        title: 'Error',
        description: 'Failed to claim donation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Stack spacing={8}>
        <Box>
          <Heading size="lg" mb={5}>Available Donations</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
            {availableDonations.map((donation) => (
              <Card key={donation._id}>
                <CardHeader>
                  <Heading size="md">{donation.foodName}</Heading>
                </CardHeader>
                <CardBody>
                  <Stack spacing={3}>
                    <Text>{donation.description}</Text>
                    <Text><strong>Quantity:</strong> {donation.quantity} {donation.unit}</Text>
                    <Text><strong>Expiration Date:</strong> {new Date(donation.expirationDate).toLocaleDateString()}</Text>
                    <Text><strong>Pickup Address:</strong> {donation.pickupAddress?.street}, {donation.pickupAddress?.city}, {donation.pickupAddress?.state} {donation.pickupAddress?.zipCode}</Text>
                    {donation.imageUrl && <img src={donation.imageUrl} alt="Food" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />}
                    {/* Map removed: displaying address only */}
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
        </Box>

        <Box>
          <Heading size="lg" mb={5}>My Pickups</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
            {myPickups.map((pickup) => (
              <Card key={pickup._id}>
                <CardHeader>
                  <Heading size="md">{pickup.donation.foodName}</Heading>
                </CardHeader>
                <CardBody>
                  <Stack spacing={3}>
                    <Text>{pickup.donation.description}</Text>
                    <Text><strong>Quantity:</strong> {pickup.donation.quantity} {pickup.donation.unit}</Text>
                    <Text><strong>Pickup Address:</strong> {pickup.donation.pickupAddress?.street}, {pickup.donation.pickupAddress?.city}, {pickup.donation.pickupAddress?.state} {pickup.donation.pickupAddress?.zipCode}</Text>
                    <Badge
                      colorScheme={pickup.status === 'pending' ? 'yellow' : 'green'}
                      alignSelf="start"
                    >
                      {pickup.status}
                    </Badge>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      </Stack>

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
    </Container>
  );
}