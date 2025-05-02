import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  useColorModeValue,
  useColorMode,
  IconButton
} from '@chakra-ui/react';
// Use react-icons for theme icons
import { FaMoon, FaSun } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Box bg={bgColor} px={4} boxShadow='sm'>
      <Flex h={16} alignItems='center' justifyContent='space-between'>
        <Link as={RouterLink} to='/' _hover={{ textDecoration: 'none' }}>
          <Text fontSize='2xl' fontWeight='extrabold' color='brand.500'>
            Food Rescue Network
          </Text>
        </Link>

        <Flex alignItems='center'>
          <Stack direction='row' spacing={4} alignItems='center'>
            <IconButton
              aria-label='Toggle theme'
              icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
              variant='ghost'
              onClick={toggleColorMode}
            />
            {!user ? (
              <>
                <Button as={RouterLink} to='/login' variant='ghost' colorScheme='brand'>Login</Button>
                <Button as={RouterLink} to='/register' colorScheme='brand'>Register</Button>
              </>
            ) : (
              <>
                <Stack direction='row' spacing={4} alignItems='center'>
                  {/* Home link to landing page */}
                  <Button as={RouterLink} to='/' variant='ghost'>Home</Button>
                  <Button as={RouterLink} to={`/${user.role}/dashboard`} variant='ghost'>Available Donations</Button>
                  <Button as={RouterLink} to='/history' variant='ghost'>History</Button>
                  <Button as={RouterLink} to='/profile' variant='ghost'>Profile</Button>
                  <Button as={RouterLink} to='/help' variant='ghost'>Help</Button>
                  <Button onClick={handleLogout} variant='ghost'>Logout</Button>
                </Stack>
              </>
            )}
          </Stack>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;