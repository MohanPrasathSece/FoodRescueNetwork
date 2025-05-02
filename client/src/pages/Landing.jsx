import React from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Container,
  Text,
  Button,
  Stack,
  SimpleGrid,
  useColorModeValue,
  Flex,
  VStack,
  Image,
  Divider,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';

export default function Landing() {
  const { user, loading } = useAuth();
  const cardBg = useColorModeValue('white', 'gray.700');

  if (loading) return null;
  if (user) return <Navigate to="/home" replace />;

  return (
    <Box bg="green.50" minH="100vh">
      <Container maxW={'6xl'} pt={10}>
        <Flex justifyContent="flex-end" mb={4}></Flex>
        
        {/* Hero Section */}
        <Stack
          as={Box}
          textAlign={'center'}
          spacing={{ base: 8, md: 14 }}
          py={{ base: 10, md: 20 }}>
          <Heading
            fontWeight={700}
            fontSize={{ base: '3xl', sm: '4xl', md: '6xl' }}
            lineHeight={'110%'}>
            Reducing Food Waste <br />
            <Text as={'span'} color={'green.400'}>
              Helping Communities
            </Text>
          </Heading>
          <Text color={'gray.500'} fontSize={{ base: 'lg', md: 'xl' }} maxW={'3xl'} mx="auto">
            Join our network of food donors and volunteers working together to reduce food waste
            and help those in need. Whether you're a restaurant, grocery store, or someone who
            wants to make a difference, we make it easy to connect and contribute.
          </Text>
          
          {/* Main CTA Section */}
          <Stack
            direction={'column'}
            spacing={6}
            align={'center'}
            alignSelf={'center'}
            position={'relative'}
            zIndex={1}>
            
            <Heading as="h2" size="lg" mb={2}>
              I want to:
            </Heading>
            
            {/* Removed banner per request */}
            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              spacing={{ base: 5, md: 8 }}
              maxW="2xl"
              mx="auto"
              justifyItems="center"
            >
              <VStack 
                spacing={4} 
                p={6} 
                borderRadius="lg" 
                boxShadow="xl"
                bg={cardBg}
                _hover={{ transform: 'translateY(-5px)', transition: '0.3s' }}
              >
                <Image 
                  src="https://media.istockphoto.com/vectors/illustration-icon-with-the-concept-of-food-donation-vector-id951697932?k=6&m=951697932&s=170667a&w=0&h=jJSQTVE9Aao4O0QfKvE-iz6fR02AeCrDIv4NVRU1zvo="
                  alt="Donate Food" 
                  boxSize="100px"
                />
                <Heading as="h3" size="md">Donate Food</Heading>
                <Text textAlign="center">Share your excess food with those in need</Text>
                <Button
                  as={RouterLink}
                  to='/register?role=donor'
                  colorScheme={'green'}
                  rounded={'full'}
                  px={6}
                  size="lg"
                  width="100%"
                  _hover={{
                    bg: 'green.500',
                  }}>
                  Become a Donor
                </Button>
              </VStack>
              
              <VStack 
                spacing={4} 
                p={6} 
                borderRadius="lg" 
                boxShadow="xl"
                bg={cardBg}
                _hover={{ transform: 'translateY(-5px)', transition: '0.3s' }}
              >
                <Image 
                  src="https://img.freepik.com/premium-vector/find-food-logo-vector-food-search-logo-concept-design-concept-logo-logotype-element-template_7649-3792.jpg" 
                  alt="Receive Food" 
                  boxSize="100px"
                />
                <Heading as="h3" size="md">Find Food</Heading>
                <Text textAlign="center">Connect with local food donations near you</Text>
                <Button
                  as={RouterLink}
                  to='/register?role=volunteer'
                  colorScheme={'blue'}
                  rounded={'full'}
                  px={6}
                  size="lg"
                  width="100%"
                  _hover={{
                    bg: 'blue.500',
                  }}>
                  Find Available Food
                </Button>
              </VStack>
            </SimpleGrid>
            
            <Divider my={8} />
            
            <Text color={'gray.500'} fontSize="md">
              Already have an account?{' '}
              <Button
                as={RouterLink}
                to='/login'
                variant={'link'}
                colorScheme={'green'}
                size={'md'}>
                Sign in here
              </Button>
            </Text>
          </Stack>
        </Stack>
      </Container>
      <Footer />
    </Box>
  );
}