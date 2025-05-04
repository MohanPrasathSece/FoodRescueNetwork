import React from 'react';
import { Box, Heading, Text, Button, Stack, VStack, useColorModeValue, Image } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink } from 'react-router-dom';

export default function AuthLanding() {
  const { user } = useAuth();
  const greeting = user?.role === 'donor' ? 'Welcome, Food Donor!' : 'Welcome, Volunteer!';

  // Rotating inspiring quotes
  const QUOTES = [
    { text: 'Alone we can do so little; together we can do so much.', author: 'Helen Keller', color: 'teal.600' },
    { text: 'The best way to find yourself is to lose yourself in the service of others.', author: 'Mahatma Gandhi', color: 'green.600' },
    { text: 'No one has ever become poor by giving.', author: 'Anne Frank', color: 'blue.600' },
    { text: 'Hunger is not an issue of charity. It is an issue of justice.', author: 'Jacques Diouf', color: 'orange.600' },
    { text: 'We make a living by what we get, but we make a life by what we give.', author: 'Winston Churchill', color: 'purple.600' }
  ];
  const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

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
        <Box mb={2}>
          <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color={randomQuote.color}>
            “{randomQuote.text}”
          </Text>
          <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600" mt={1}>
            — {randomQuote.author}
          </Text>
        </Box>
        <Stack direction="column" spacing={4} mt={6} align="center">
          {user?.role === 'donor' ? (
            <Button
              as={RouterLink}
              to="/donor/dashboard"
              colorScheme="teal"
              size="lg"
              w={{ base: '100%', sm: '200px' }}
              mx="auto"
            >
              Donate Food
            </Button>
          ) : (
            <Button
              as={RouterLink}
              to="/volunteer/dashboard"
              colorScheme="blue"
              size="lg"
              w={{ base: '100%', sm: '200px' }}
              mx="auto"
            >
              Find Food
            </Button>
          )}
        </Stack>
      </VStack>
    </Box>
  );
}
