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
  useColorModeValue
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
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
          <Text fontSize='xl' fontWeight='bold' color='green.500'>
            Food Rescue Network
          </Text>
        </Link>

        <Flex alignItems='center'>
          <Stack direction='row' spacing={4}>
            {!user ? (
              <>
                <Button
                  as={RouterLink}
                  to='/login'
                  variant='ghost'
                  colorScheme='green'
                >
                  Login
                </Button>
                <Button
                  as={RouterLink}
                  to='/register'
                  colorScheme='green'
                >
                  Register
                </Button>
              </>
            ) : (
              <>
                {user.role === 'donor' && (
                  <Button
                    as={RouterLink}
                    to='/donor/dashboard'
                    variant='ghost'
                    colorScheme='green'
                  >
                    Donate Food
                  </Button>
                )}
                {user.role === 'volunteer' && (
                  <Button
                    as={RouterLink}
                    to='/volunteer/dashboard'
                    variant='ghost'
                    colorScheme='green'
                  >
                    I Need Food
                  </Button>
                )}
                <Menu>
                  <MenuButton
                    as={Button}
                    variant='ghost'
                    colorScheme='green'
                    rightIcon={<Avatar size='xs' name={user.name || user.email} />}
                  >
                    Profile
                  </MenuButton>
                  <MenuList>
                    <MenuItem
                      as={RouterLink}
                      to={`/${user.role}/dashboard`}
                    >
                      Dashboard
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      Logout
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            )}
          </Stack>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;