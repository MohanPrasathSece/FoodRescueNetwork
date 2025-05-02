import React from 'react';
import { Box, Heading, Text, Button, Stack, VStack, useColorModeValue, Image } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

export default function AuthLanding() {
  const { user } = useAuth();
  const greeting = user?.role === 'donor' ? 'Welcome, Food Donor!' : 'Welcome, Volunteer!';
  const quote = "“Alone we can do so little; together we can do so much.”";

  const dashboardPath = user?.role === 'donor' ? '/donor/dashboard' : '/volunteer/dashboard';

  return (
    <Box pos="relative" minH="100vh" py={10} px={4}>
      {/* Background image */}
      <Box
        pos="absolute"
        top={0}
        left={0}
        w="100%"
        h="100%"
        bgImage="url('https://files.globalgiving.org/pfil/3419/pict_large.jpg?m=1249025181000')"
        bgSize="cover"
        bgPosition="center"
        opacity={0.5}
        zIndex={-1}
      />
      <VStack spacing={6} maxW="xl" mx="auto" textAlign="center" pos="relative">
        <Heading>{greeting}</Heading>
        <Text fontSize="lg" color="gray.600">{quote}</Text>
        <Stack direction="column" spacing={4} mt={4}>
          {user?.role === 'donor' ? (
            <Button as={RouterLink} to="/donor/dashboard" colorScheme="teal">Donate Food</Button>
          ) : (
            <Button as={RouterLink} to="/volunteer/dashboard" colorScheme="blue">Find Food</Button>
          )}
        </Stack>
      </VStack>
    </Box>
  );
}
