import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Text,
  Stack,
  Badge,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
} from '@chakra-ui/react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [pickups, setPickups] = useState([]);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchUsers();
    fetchAllDonations();
    fetchAllPickups();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchAllDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/donations', {
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

  const fetchAllPickups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/pickups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPickups(response.data);
    } catch (error) {
      console.error('Error fetching pickups:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pickups',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUserStatusChange = async (userId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/admin/users/${userId}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Success',
        description: 'User status updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Heading size="lg" mb={5}>Admin Dashboard</Heading>

      <Tabs>
        <TabList>
          <Tab>Users</Tab>
          <Tab>Donations</Tab>
          <Tab>Pickups</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
              {users.map((user) => (
                <Card key={user._id}>
                  <CardHeader>
                    <Heading size="md">{user.name}</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={3}>
                      <Text><strong>Email:</strong> {user.email}</Text>
                      <Text><strong>Role:</strong> {user.role}</Text>
                      <Badge
                        colorScheme={user.status === 'active' ? 'green' : 'red'}
                        alignSelf="start"
                      >
                        {user.status}
                      </Badge>
                      <Button
                        size="sm"
                        colorScheme={user.status === 'active' ? 'red' : 'green'}
                        onClick={() => handleUserStatusChange(
                          user._id,
                          user.status === 'active' ? 'inactive' : 'active'
                        )}
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </TabPanel>

          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
              {donations.map((donation) => (
                <Card key={donation._id}>
                  <CardHeader>
                    <Heading size="md">{donation.title}</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={3}>
                      <Text><strong>Donor:</strong> {donation.donor.name}</Text>
                      <Text><strong>Quantity:</strong> {donation.quantity}</Text>
                      <Text><strong>Expiry Date:</strong> {new Date(donation.expiryDate).toLocaleDateString()}</Text>
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
          </TabPanel>

          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
              {pickups.map((pickup) => (
                <Card key={pickup._id}>
                  <CardHeader>
                    <Heading size="md">{pickup.donation.title}</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={3}>
                      <Text><strong>Volunteer:</strong> {pickup.volunteer.name}</Text>
                      <Text><strong>Donor:</strong> {pickup.donation.donor.name}</Text>
                      <Text><strong>Pickup Address:</strong> {pickup.donation.pickupAddress}</Text>
                      <Badge
                        colorScheme={pickup.status === 'completed' ? 'green' : 'yellow'}
                        alignSelf="start"
                      >
                        {pickup.status}
                      </Badge>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
}