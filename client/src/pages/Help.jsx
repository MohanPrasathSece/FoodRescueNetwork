import React, { useState } from 'react';
import axios from 'axios';
import {
  Box, Container, Heading, FormControl, FormLabel,
  Input, Textarea, Button, useToast, useColorModeValue
} from '@chakra-ui/react';

export default function Help() {
  const [form, setForm] = useState({ name:'', email:'', message:'' });
  const toast = useToast();

  // add color mode values
  const containerBg = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('white', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const pageBg = useColorModeValue('gray.50','gray.800');

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      // Use full API URL to bypass CRA proxy
      const response = await axios.post('http://localhost:5000/api/help', form);
      if (response.data.success) {
        toast({ title: 'Message sent', status: 'success' });
        setForm({ name: '', email: '', message: '' });
      } else {
        toast({ title: 'Error', description: response.data.error, status: 'error' });
      }
    } catch (err) {
      console.error('Help form error:', err);
      toast({ title: 'Error', description: 'Could not send message', status: 'error' });
    }
  };

  return (
    <Box py={10} bg={pageBg}>
      <Container maxW="lg" bg={containerBg} p={8} rounded="md" boxShadow="md" color={textColor}>
        <Heading mb={6} textAlign="center" color="green.500">
          Contact Us
        </Heading>
        <form onSubmit={handleSubmit}>
          <FormControl mb={4} isRequired>
            <FormLabel>Name</FormLabel>
            <Input name="name" value={form.name} onChange={handleChange} bg={inputBg} color={textColor} />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Email</FormLabel>
            <Input name="email" type="email" value={form.email} onChange={handleChange} bg={inputBg} color={textColor} />
          </FormControl>
          <FormControl mb={6} isRequired>
            <FormLabel>Message</FormLabel>
            <Textarea name="message" rows={6} value={form.message} onChange={handleChange} bg={inputBg} color={textColor} />
          </FormControl>
          <Button
            type="submit"
            colorScheme="green"
            width="full"
            _hover={{ bg:'green.600' }}
          >
            Send Message
          </Button>
        </form>
      </Container>
    </Box>
  );
}
