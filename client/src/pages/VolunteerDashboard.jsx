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
      const response = await axios.get('http://localhost:5000/api/donations/available', {
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
      await axios.post(`http://localhost:5000/api/pickups`, {
        donationId: selectedDonation._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Success',
        description: 'Pickup request submitted successfully',
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
        description: 'Failed to submit pickup request',
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
                  <Heading size="md">{donation.title}</Heading>
                </CardHeader>
                <CardBody>
                  <Stack spacing={3}>
                    <Text>{donation.description}</Text>
                    <Text><strong>Quantity:</strong> {donation.quantity}</Text>
                    <Text><strong>Expiry Date:</strong> {new Date(donation.expiryDate).toLocaleDateString()}</Text>
                    <Text><strong>Pickup Address:</strong> {donation.pickupAddress}</Text>
                    <Badge colorScheme="green" alignSelf="start">
                      Available
                    </Badge>
                  </Stack>
                </CardBody>
                <CardFooter>
                  <Button
                    colorScheme="green"
                    onClick={() => handlePickupRequest(donation)}
                  >
                    Request Pickup
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
                  <Heading size="md">{pickup.donation.title}</Heading>
                </CardHeader>
                <CardBody>
                  <Stack spacing={3}>
                    <Text>{pickup.donation.description}</Text>
                    <Text><strong>Quantity:</strong> {pickup.donation.quantity}</Text>
                    <Text><strong>Pickup Address:</strong> {pickup.donation.pickupAddress}</Text>
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
            <Text>Are you sure you want to request pickup for this donation?</Text>
            {selectedDonation && (
              <Box mt={4}>
                <Text><strong>Title:</strong> {selectedDonation.title}</Text>
                <Text><strong>Quantity:</strong> {selectedDonation.quantity}</Text>
                <Text><strong>Address:</strong> {selectedDonation.pickupAddress}</Text>
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