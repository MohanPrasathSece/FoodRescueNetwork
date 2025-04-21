import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Text,
  Stack,
  Badge,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function DonorDashboard() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [donations, setDonations] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    expiryDate: '',
    pickupAddress: '',
  });
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/donations/my-donations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDonations(response.data);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch donations',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/donations', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: 'Success',
        description: 'Donation posted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      fetchDonations();
      setFormData({
        title: '',
        description: '',
        quantity: '',
        expiryDate: '',
        pickupAddress: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to post donation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={5}>
        <Heading size="lg">My Donations</Heading>
        <Button colorScheme="green" onClick={onOpen}>New Donation</Button>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
        {donations.map((donation) => (
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
                <Badge
                  colorScheme={donation.status === 'available' ? 'green' : 'orange'}
                  alignSelf="start"
                >
                  {donation.status}
                </Badge>
              </Stack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>Create New Donation</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Quantity</FormLabel>
                  <Input
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Expiry Date</FormLabel>
                  <Input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Pickup Address</FormLabel>
                  <Input
                    name="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={handleChange}
                  />
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} type="submit">
                Create
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Container>
  );
}