import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
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
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  HStack,
  VStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Divider,
  Image,
  Progress,
  Tooltip,
  useColorModeValue,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalVolunteers: 0,
    totalDonations: 0,
    activeDonations: 0,
    completedDonations: 0,
    totalFoodSaved: 0,
    weeklyDonations: 0,
    monthlyDonations: 0
  });
  const [userFilter, setUserFilter] = useState('all');
  const [donationFilter, setDonationFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  
  const { user } = useAuth();
  const toast = useToast();
  const cancelRef = useRef();
  
  // Modals
  const { 
    isOpen: isUserDetailOpen, 
    onOpen: onUserDetailOpen, 
    onClose: onUserDetailClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDonationDetailOpen, 
    onOpen: onDonationDetailOpen, 
    onClose: onDonationDetailClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteAlertOpen, 
    onOpen: onDeleteAlertOpen, 
    onClose: onDeleteAlertClose 
  } = useDisclosure();

  useEffect(() => {
    fetchUsers();
    fetchAllDonations();
    fetchAllPickups();
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard statistics',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
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
      const response = await axios.get('/api/admin/donations', {
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
      const response = await axios.get('/api/admin/pickups', {
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
      await axios.patch(`/api/admin/users/${userId}`, {
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
      fetchDashboardStats();
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
  
  const handleDonationModeration = async (donationId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/admin/donations/${donationId}`, {
        action
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Success',
        description: `Donation ${action === 'approve' ? 'approved' : 'removed'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchAllDonations();
      fetchDashboardStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} donation`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const openUserDetails = (user) => {
    setSelectedUser(user);
    onUserDetailOpen();
  };
  
  const openDonationDetails = (donation) => {
    setSelectedDonation(donation);
    onDonationDetailOpen();
  };
  
  const filteredUsers = users.filter(user => {
    if (userFilter !== 'all' && user.role !== userFilter) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.organization && user.organization.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
  
  const filteredDonations = donations.filter(donation => {
    if (donationFilter !== 'all' && donation.status !== donationFilter) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        donation.foodName.toLowerCase().includes(searchLower) ||
        donation.description.toLowerCase().includes(searchLower) ||
        donation.donor.name.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const statCardBg = useColorModeValue('blue.50', 'blue.900');
  
  return (
    <Container maxW="container.xl" py={5}>
      <Heading size="lg" mb={5}>Admin Dashboard</Heading>
      
      {/* Dashboard Stats */}
      <Box mb={8}>
        <Heading size="md" mb={4}>System Overview</Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
          <Card bg={statCardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Total Users</StatLabel>
                <StatNumber>{stats.totalUsers}</StatNumber>
                <HStack>
                  <StatHelpText>
                    {stats.totalDonors} Donors
                  </StatHelpText>
                  <StatHelpText>
                    {stats.totalVolunteers} Volunteers
                  </StatHelpText>
                </HStack>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={statCardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Total Donations</StatLabel>
                <StatNumber>{stats.totalDonations}</StatNumber>
                <HStack>
                  <StatHelpText>
                    {stats.activeDonations} Active
                  </StatHelpText>
                  <StatHelpText>
                    {stats.completedDonations} Completed
                  </StatHelpText>
                </HStack>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={statCardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Food Saved (kg)</StatLabel>
                <StatNumber>{stats.totalFoodSaved}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {stats.weeklyDonations} this week
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={statCardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Monthly Growth</StatLabel>
                <StatNumber>{stats.monthlyDonations}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  23.36%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>

      <Tabs>
        <TabList>
          <Tab>Users</Tab>
          <Tab>Donations</Tab>
          <Tab>Pickups</Tab>
          <Tab>Reports</Tab>
        </TabList>

        <TabPanels>
          {/* Users Tab */}
          <TabPanel>
            <Flex justify="space-between" mb={4} wrap="wrap" gap={2}>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  🔍
                </InputLeftElement>
                <Input 
                  placeholder="Search users..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              <Select 
                maxW="200px" 
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="donor">Donors</option>
                <option value="volunteer">Volunteers</option>
                <option value="admin">Admins</option>
              </Select>
            </Flex>
            
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredUsers.map((user) => (
                  <Tr key={user._id}>
                    <Td>{user.name}</Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <Badge colorScheme={
                        user.role === 'admin' ? 'purple' : 
                        user.role === 'donor' ? 'green' : 'blue'
                      }>
                        {user.role}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={user.status === 'active' ? 'green' : 'red'}>
                        {user.status}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button 
                          size="sm" 
                          colorScheme="blue"
                          onClick={() => openUserDetails(user)}
                        >
                          View
                        </Button>
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
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>
          
          {/* Donations Tab */}
          <TabPanel>
            <Flex justify="space-between" mb={4} wrap="wrap" gap={2}>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  🔍
                </InputLeftElement>
                <Input 
                  placeholder="Search donations..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              <Select 
                maxW="200px" 
                value={donationFilter}
                onChange={(e) => setDonationFilter(e.target.value)}
              >
                <option value="all">All Donations</option>
                <option value="available">Available</option>
                <option value="claimed">Claimed</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
              </Select>
            </Flex>
            
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Food Name</Th>
                  <Th>Donor</Th>
                  <Th>Quantity</Th>
                  <Th>Expiry Date</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredDonations.map((donation) => (
                  <Tr key={donation._id}>
                    <Td>{donation.foodName}</Td>
                    <Td>{donation.donor?.name || 'Unknown'}</Td>
                    <Td>{donation.quantity} {donation.unit}</Td>
                    <Td>{new Date(donation.expirationDate).toLocaleDateString()}</Td>
                    <Td>
                      <Badge colorScheme={
                        donation.status === 'available' ? 'green' : 
                        donation.status === 'claimed' ? 'blue' : 
                        donation.status === 'completed' ? 'purple' : 'red'
                      }>
                        {donation.status}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button 
                          size="sm" 
                          colorScheme="blue"
                          onClick={() => openDonationDetails(donation)}
                        >
                          View
                        </Button>
                        {donation.status === 'available' && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDonationModeration(donation._id, 'remove')}
                          >
                            Remove
                          </Button>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>
          
          {/* Pickups Tab */}
          <TabPanel>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Donation</Th>
                  <Th>Volunteer</Th>
                  <Th>Donor</Th>
                  <Th>Scheduled Time</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pickups.map((pickup) => (
                  <Tr key={pickup._id}>
                    <Td>{pickup.donation?.foodName || 'Unknown'}</Td>
                    <Td>{pickup.volunteer?.name || 'Unknown'}</Td>
                    <Td>{pickup.donation?.donor?.name || 'Unknown'}</Td>
                    <Td>{pickup.scheduledTime ? new Date(pickup.scheduledTime).toLocaleString() : 'Not scheduled'}</Td>
                    <Td>
                      <Badge colorScheme={
                        pickup.status === 'completed' ? 'green' : 
                        pickup.status === 'in-progress' ? 'blue' : 
                        pickup.status === 'scheduled' ? 'yellow' : 'red'
                      }>
                        {pickup.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Button size="sm" colorScheme="blue">
                        View Details
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>
          
          {/* Reports Tab */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              <Card>
                <CardHeader>
                  <Heading size="md">Donation Activity</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text mb={2}>Weekly Donations</Text>
                      <Progress value={70} colorScheme="green" size="lg" />
                    </Box>
                    <Box>
                      <Text mb={2}>Monthly Donations</Text>
                      <Progress value={85} colorScheme="blue" size="lg" />
                    </Box>
                    <Box>
                      <Text mb={2}>Completion Rate</Text>
                      <Progress value={65} colorScheme="purple" size="lg" />
                    </Box>
                  </VStack>
                </CardBody>
                <CardFooter>
                  <Button colorScheme="blue">Download Report</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <Heading size="md">User Growth</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text>New Donors:</Text>
                      <Text fontWeight="bold">+12 this month</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>New Volunteers:</Text>
                      <Text fontWeight="bold">+18 this month</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Active Users:</Text>
                      <Text fontWeight="bold">87% of total</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Retention Rate:</Text>
                      <Text fontWeight="bold">92%</Text>
                    </HStack>
                  </VStack>
                </CardBody>
                <CardFooter>
                  <Button colorScheme="blue">Download Report</Button>
                </CardFooter>
              </Card>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* User Detail Modal */}
      {selectedUser && (
        <Modal isOpen={isUserDetailOpen} onClose={onUserDetailClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>User Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Text fontWeight="bold" width="120px">Name:</Text>
                  <Text>{selectedUser.name}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" width="120px">Email:</Text>
                  <Text>{selectedUser.email}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" width="120px">Role:</Text>
                  <Badge colorScheme={
                    selectedUser.role === 'admin' ? 'purple' : 
                    selectedUser.role === 'donor' ? 'green' : 'blue'
                  }>
                    {selectedUser.role}
                  </Badge>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" width="120px">Status:</Text>
                  <Badge colorScheme={selectedUser.status === 'active' ? 'green' : 'red'}>
                    {selectedUser.status}
                  </Badge>
                </HStack>
                {selectedUser.organization && (
                  <HStack>
                    <Text fontWeight="bold" width="120px">Organization:</Text>
                    <Text>{selectedUser.organization}</Text>
                  </HStack>
                )}
                {selectedUser.phone && (
                  <HStack>
                    <Text fontWeight="bold" width="120px">Phone:</Text>
                    <Text>{selectedUser.phone}</Text>
                  </HStack>
                )}
                {selectedUser.address && (
                  <>
                    <Text fontWeight="bold">Address:</Text>
                    <Box pl={4}>
                      <Text>{selectedUser.address.street}</Text>
                      <Text>{selectedUser.address.city}, {selectedUser.address.state} {selectedUser.address.zipCode}</Text>
                    </Box>
                  </>
                )}
                <Divider />
                <Text fontWeight="bold">Account Activity:</Text>
                <HStack>
                  <Text fontWeight="bold" width="120px">Joined:</Text>
                  <Text>{new Date(selectedUser.createdAt).toLocaleDateString()}</Text>
                </HStack>
                {selectedUser.role === 'donor' && (
                  <HStack>
                    <Text fontWeight="bold" width="120px">Donations:</Text>
                    <Text>12 total (8 completed)</Text>
                  </HStack>
                )}
                {selectedUser.role === 'volunteer' && (
                  <HStack>
                    <Text fontWeight="bold" width="120px">Pickups:</Text>
                    <Text>8 total (6 completed)</Text>
                  </HStack>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onUserDetailClose}>
                Close
              </Button>
              <Button
                colorScheme={selectedUser.status === 'active' ? 'red' : 'green'}
                onClick={() => {
                  handleUserStatusChange(
                    selectedUser._id,
                    selectedUser.status === 'active' ? 'inactive' : 'active'
                  );
                  onUserDetailClose();
                }}
              >
                {selectedUser.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
      
      {/* Donation Detail Modal */}
      {selectedDonation && (
        <Modal isOpen={isDonationDetailOpen} onClose={onDonationDetailClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{selectedDonation.foodName}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                {selectedDonation.imageUrl && (
                  <Image 
                    src={selectedDonation.imageUrl} 
                    alt={selectedDonation.foodName}
                    borderRadius="md"
                    maxH="200px"
                    objectFit="cover"
                  />
                )}
                
                <HStack>
                  <Text fontWeight="bold" width="120px">Food Type:</Text>
                  <Badge colorScheme={
                    selectedDonation.foodType === 'produce' ? 'green' : 
                    selectedDonation.foodType === 'prepared' ? 'orange' : 'blue'
                  }>
                    {selectedDonation.foodType}
                  </Badge>
                </HStack>
                
                <HStack>
                  <Text fontWeight="bold" width="120px">Description:</Text>
                  <Text>{selectedDonation.description}</Text>
                </HStack>
                
                <HStack>
                  <Text fontWeight="bold" width="120px">Quantity:</Text>
                  <Text>{selectedDonation.quantity} {selectedDonation.unit}</Text>
                </HStack>
                
                <HStack>
                  <Text fontWeight="bold" width="120px">Expiry Date:</Text>
                  <Text>{new Date(selectedDonation.expirationDate).toLocaleString()}</Text>
                </HStack>
                
                <HStack>
                  <Text fontWeight="bold" width="120px">Status:</Text>
                  <Badge colorScheme={
                    selectedDonation.status === 'available' ? 'green' : 
                    selectedDonation.status === 'claimed' ? 'blue' : 
                    selectedDonation.status === 'completed' ? 'purple' : 'red'
                  }>
                    {selectedDonation.status}
                  </Badge>
                </HStack>
                
                <Divider />
                
                <Text fontWeight="bold">Donor Information:</Text>
                <HStack>
                  <Text fontWeight="bold" width="120px">Name:</Text>
                  <Text>{selectedDonation.donor?.name || 'Unknown'}</Text>
                </HStack>
                
                {selectedDonation.donor?.organization && (
                  <HStack>
                    <Text fontWeight="bold" width="120px">Organization:</Text>
                    <Text>{selectedDonation.donor.organization}</Text>
                  </HStack>
                )}
                
                <Text fontWeight="bold">Pickup Address:</Text>
                <Box pl={4}>
                  <Text>{selectedDonation.pickupAddress?.street}</Text>
                  <Text>
                    {selectedDonation.pickupAddress?.city}, 
                    {selectedDonation.pickupAddress?.state} 
                    {selectedDonation.pickupAddress?.zipCode}
                  </Text>
                </Box>
                
                {selectedDonation.pickupInstructions && (
                  <>
                    <Text fontWeight="bold">Pickup Instructions:</Text>
                    <Text>{selectedDonation.pickupInstructions}</Text>
                  </>
                )}
                
                {selectedDonation.claimedBy && (
                  <>
                    <Divider />
                    <Text fontWeight="bold">Claimed By:</Text>
                    <HStack>
                      <Text fontWeight="bold" width="120px">Name:</Text>
                      <Text>{selectedDonation.claimedBy.name}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="bold" width="120px">Email:</Text>
                      <Text>{selectedDonation.claimedBy.email}</Text>
                    </HStack>
                  </>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onDonationDetailClose}>
                Close
              </Button>
              {selectedDonation.status === 'available' && (
                <Button
                  colorScheme="red"
                  onClick={() => {
                    handleDonationModeration(selectedDonation._id, 'remove');
                    onDonationDetailClose();
                  }}
                >
                  Remove Donation
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}