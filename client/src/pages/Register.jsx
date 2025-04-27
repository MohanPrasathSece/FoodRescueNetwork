import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  Link,
  Select,
  useToast,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'donor',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await register(formData);
      toast({ title: 'Registration successful', status: 'success', duration: 3000, isClosable: true });
      navigate(`/${user.role}/dashboard`);
    } catch (error) {
      toast({ title: 'Registration failed', description: error.response?.data?.message || error.message || 'An unexpected error occurred', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minH={'100vh'}
      display={'flex'}
      alignItems={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}>
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'}>Create your account</Heading>
          <Text fontSize={'lg'} color={'gray.600'}>
            Join our food rescue mission ✌️
          </Text>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl id="name">
                <FormLabel>Name</FormLabel>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </FormControl>
              <FormControl id="email">
                <FormLabel>Email address</FormLabel>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </FormControl>
              <FormControl id="password">
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </FormControl>
              <FormControl id="role">
                <FormLabel>I want to</FormLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="donor">Donate Food</option>
                  <option value="volunteer">Volunteer</option>
                </Select>
              </FormControl>
              <Stack spacing={10}>
                <Button
                  type="submit"
                  bg={'green.400'}
                  color={'white'}
                  _hover={{
                    bg: 'green.500',
                  }}
                  isLoading={isLoading}>
                  Sign up
                </Button>
              </Stack>
              <Stack pt={6}>
                <Text align={'center'}>
                  Already a user?{' '}
                  <Link as={RouterLink} to='/login' color={'green.400'}>
                    Login
                  </Link>
                </Text>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Box>
  );
}