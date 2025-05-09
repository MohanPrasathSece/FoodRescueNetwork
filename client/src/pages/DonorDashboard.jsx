import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Image,
  AspectRatio,
  Skeleton
} from '@chakra-ui/react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useColorModeValue } from '@chakra-ui/react';

export default function DonorDashboard() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [donations, setDonations] = useState([]);
  const [imageLoaded, setImageLoaded] = useState({});
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

  // Match volunteer styling
  const containerBg = useColorModeValue('white','gray.700');
  const cardBg = useColorModeValue('white','gray.600');
  const textColor = useColorModeValue('gray.800','whiteAlpha.900');

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    // Load cached donations for instant UI
    const cache = sessionStorage.getItem('myDonations');
    if (cache) setDonations(JSON.parse(cache));
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/donations/my-donations', { headers: { Authorization: `Bearer ${token}` } });
      setDonations(response.data);
      // Cache minimal donation metadata only
      try {
        const meta = response.data.map(({ _id, foodName, expirationDate, imageUrl, status }) => ({ _id, foodName, expirationDate, imageUrl, status }));
        sessionStorage.setItem('myDonations', JSON.stringify(meta));
      } catch (e) {
        console.warn('Failed to cache donations:', e);
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast({ title: 'Error', description: 'Failed to fetch donations', status: 'error', duration: 3000, isClosable: true });
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
        await axios.put(`/api/donations/${editingDonation._id}`, form, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        toast({ title: 'Success', description: 'Donation updated.', status: 'success', duration: 3000, isClosable: true });
      } else {
        await axios.post('/api/donations', form, {
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
      await axios.delete(`/api/donations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Deleted', description: 'Donation deleted.', status: 'info', duration: 3000, isClosable: true });
      setDonations(prev => prev.filter(d => d._id !== id));
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete donation';
      toast({ title: 'Error', description: msg, status: 'error', duration: 3000, isClosable: true });
    }
  };

  // Only show active donations here.
  const activeDonations = donations.filter(d => d.status === 'available');

  return (
    <Box py={10} px={{ base: 4, md: 8 }}
      bgImage={`linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url('https://thumbs.dreamstime.com/z/indian-children-beach-goa-india-november-unidentified-playing-157502713.jpg')`}
      bgSize="cover"
      bgPosition="center"
    >
      <Box maxW="container.xl" mx="auto">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={5} bg="var(--chakra-colors-green-50)" p={4} borderRadius="lg" boxShadow="md">
          <Heading size="lg" color="var(--chakra-colors-green-700)">
            My Donations <Badge ml={2} colorScheme="green">{activeDonations.length}</Badge>
          </Heading>
          <Button
            colorScheme="green"
            size="lg"
            fontWeight="bold"
            px={8}
            py={6}
            borderRadius="full"
            boxShadow="lg"
            _hover={{ bg: 'var(--chakra-colors-green-400)', color: 'white' }}
            onClick={() => {
              setEditingDonation(null);
              setFormData({
                foodName: '', description: '', quantity: '', unit: '', expirationDate: '',
                pickupAddress: { street: '', city: '', state: '', zipCode: '' }, image: null
              });
              onOpen();
            }}
          >
            + New Donation
          </Button>
        </Box>
        <Box mt={6}>
          {activeDonations.length > 0 ? (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
              {activeDonations.map(donation => (
                <Card key={donation._id} overflow="hidden" boxShadow="md" borderRadius="md" _hover={{ transform: 'scale(1.02)', boxShadow: 'lg', transition: '0.2s' }}>
                  <Box position="relative" width="100%">
                    <AspectRatio ratio={4/3}>
                      <Skeleton isLoaded={!!imageLoaded[donation._id]}>  
                        {donation.imageUrl ? (
                          <Image
                            src={
                              donation.imageUrl.startsWith('data:')
                                ? donation.imageUrl
                                : `http://localhost:5000${donation.imageUrl}`
                            }
                            alt={donation.foodName}
                            objectFit="cover"
                            loading="lazy"
                            onLoad={() => setImageLoaded(prev => ({ ...prev, [donation._id]: true }))}
                          />
                        ) : (
                          <Box
                            boxSize="150px"
                            bg="gray.200"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text>No Image</Text>
                          </Box>
                        )}
                      </Skeleton>
                    </AspectRatio>
                    <Badge position="absolute" top={2} left={2} color="var(--chakra-colors-green-400)" bg="var(--chakra-colors-green-100)">{donation.status}</Badge>
                    <Box position="absolute" bottom="0" width="100%" bgGradient="linear(to-t, rgba(0,0,0,0.7), transparent)" color="white" p={2}>
                      <Heading size="sm" noOfLines={1}>{donation.foodName}</Heading>
                    </Box>
                  </Box>
                  <Box p={3}>
                    <Text fontSize="sm" noOfLines={2}>{donation.description}</Text>
                    <Text fontSize="sm"><strong>Quantity:</strong> {donation.quantity} {donation.unit}</Text>
                    <Text fontSize="sm" color="gray.700">
                      <strong>Pickup Address:</strong> {donation.pickupAddress?.street}, {donation.pickupAddress?.city}, {donation.pickupAddress?.state} {donation.pickupAddress?.zipCode}
                    </Text>
                    <Text fontSize="sm" color="gray.700">
                      <strong>Expires On:</strong> {new Date(donation.expirationDate).toLocaleString()}
                    </Text>
                  </Box>
                  <CardFooter justify="flex-end">
                    <Button size="sm" onClick={() => handleEdit(donation)}>Edit</Button>
                    <Button size="sm" ml={2} colorScheme="red" variant="outline" onClick={() => handleDelete(donation._id)}>Delete</Button>
                  </CardFooter>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Text>No active donations yet. Create one now and help those in need!</Text>
          )}
        </Box>
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
                    <FormLabel>Expires On</FormLabel>
                    <Input type="datetime-local" name="expirationDate" value={formData.expirationDate} onChange={handleChange} />
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
      </Box>
    </Box>
  );
}