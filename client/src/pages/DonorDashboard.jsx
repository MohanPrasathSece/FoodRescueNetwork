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
    foodName: '',
    description: '',
    quantity: '',
    unit: '',
    expirationDate: '',
    pickupAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    image: null
  });
  const [editingDonation, setEditingDonation] = useState(null);
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
    if (["street", "city", "state", "zipCode"].includes(name)) {
      setFormData(prev => ({
        ...prev,
        pickupAddress: {
          ...prev.pickupAddress,
          [name]: value
        }
      }));
    } else if (name === "image") {
      setFormData(prev => ({ ...prev, image: e.target.files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('foodName', formData.foodName);
      form.append('description', formData.description);
      form.append('quantity', formData.quantity);
      form.append('unit', formData.unit);
      form.append('expirationDate', formData.expirationDate);
      form.append('pickupAddress[street]', formData.pickupAddress.street);
      form.append('pickupAddress[city]', formData.pickupAddress.city);
      form.append('pickupAddress[state]', formData.pickupAddress.state);
      form.append('pickupAddress[zipCode]', formData.pickupAddress.zipCode);
      if (formData.image) form.append('image', formData.image);
      if (editingDonation) {
        await axios.put(`http://localhost:5000/api/donations/${editingDonation._id}`, form, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        toast({ title: 'Success', description: 'Donation updated.', status: 'success', duration: 3000, isClosable: true });
      } else {
        await axios.post('http://localhost:5000/api/donations', form, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        toast({ title: 'Success', description: 'Donation posted successfully', status: 'success', duration: 3000, isClosable: true });
      }
      onClose();
      fetchDonations();
      setFormData({
        foodName: '', description: '', quantity: '', unit: '', expirationDate: '',
        pickupAddress: { street: '', city: '', state: '', zipCode: '' }, image: null
      });
      setEditingDonation(null);
    } catch (error) {
      console.error('Save donation error:', error.response?.data?.message || error.message);
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save donation', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const handleEdit = (donation) => {
    setEditingDonation(donation);
    setFormData({
      foodName: donation.foodName || '',
      description: donation.description || '',
      quantity: donation.quantity || '',
      unit: donation.unit || '',
      expirationDate: donation.expirationDate ? donation.expirationDate.substr(0, 10) : '',
      pickupAddress: donation.pickupAddress || { street: '', city: '', state: '', zipCode: '' },
      image: null
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this donation?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/donations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Deleted', description: 'Donation deleted.', status: 'info', duration: 3000, isClosable: true });
      fetchDonations();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete donation', status: 'error', duration: 3000, isClosable: true });
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
            <CardHeader display="flex" justifyContent="space-between" alignItems="center">
              <Heading size="md">{donation.foodName}</Heading>
              <Box>
                <Button size="sm" colorScheme="blue" mr={2} onClick={() => handleEdit(donation)}>Edit</Button>
                <Button size="sm" colorScheme="red" onClick={() => handleDelete(donation._id)}>Delete</Button>
              </Box>
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
                <Text><strong>Pickup Address:</strong> {donation.pickupAddress?.street}, {donation.pickupAddress?.city}, {donation.pickupAddress?.state} {donation.pickupAddress?.zipCode}</Text>
                {donation.imageUrl && <img src={donation.imageUrl} alt="Food" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />}
                <Badge colorScheme={donation.status === 'available' ? 'green' : 'orange'} alignSelf="start">
                  {donation.status}
                </Badge>
              </Stack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
      <Modal isOpen={isOpen} onClose={() => { onClose(); setEditingDonation(null); }}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <ModalHeader>{editingDonation ? 'Edit Donation' : 'Create New Donation'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Food Name</FormLabel>
                  <Input name="foodName" value={formData.foodName} onChange={handleChange} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Textarea name="description" value={formData.description} onChange={handleChange} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Quantity</FormLabel>
                  <Input name="quantity" value={formData.quantity} onChange={handleChange} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Unit</FormLabel>
                  <Input name="unit" value={formData.unit} onChange={handleChange} placeholder="e.g. kg, g, lb, items" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Expiration Date</FormLabel>
                  <Input type="date" name="expirationDate" value={formData.expirationDate} onChange={handleChange} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Pickup Address</FormLabel>
                  <Input name="street" value={formData.pickupAddress.street} onChange={handleChange} placeholder="Street" mb={2} />
                  <Input name="city" value={formData.pickupAddress.city} onChange={handleChange} placeholder="City" mb={2} />
                  <Input name="state" value={formData.pickupAddress.state} onChange={handleChange} placeholder="State" mb={2} />
                  <Input name="zipCode" value={formData.pickupAddress.zipCode} onChange={handleChange} placeholder="Zip Code" />
                </FormControl>
                <FormControl>
                  <FormLabel>Image</FormLabel>
                  <Input type="file" name="image" accept="image/*" onChange={handleChange} />
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} type="submit">
                {editingDonation ? 'Update' : 'Create'}
              </Button>
              <Button variant="ghost" onClick={() => { onClose(); setEditingDonation(null); }}>Cancel</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Container>
  );
}