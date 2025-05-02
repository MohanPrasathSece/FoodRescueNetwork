import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Container, Heading, FormControl, FormLabel, Input, Button, Avatar, useToast, useColorModeValue, Text } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name:'', email:'', phone:'', avatar:'', street:'', city:'', state:'', zipCode:'' });
  const [file, setFile] = useState(null);
  const toast = useToast();
  const containerBg = useColorModeValue('white','gray.700');
  const pageBg = useColorModeValue('gray.50','gray.800');
  const textColor = useColorModeValue('gray.800','whiteAlpha.900');

  useEffect(() => {
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      street: user.address?.street || '',
      city: user.address?.city || '',
      state: user.address?.state || '',
      zipCode: user.address?.zipCode || ''
    });
  }, [user]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = e => setFile(e.target.files[0]);

  const handleSubmit = async e => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    formData.append('address[street]', form.street);
    formData.append('address[city]', form.city);
    formData.append('address[state]', form.state);
    formData.append('address[zipCode]', form.zipCode);
    if (file) formData.append('avatar', file);
    try {
      await updateProfile(formData);
      toast({ title:'Profile updated', status:'success' });
    } catch {
      toast({ title:'Error updating profile', status:'error' });
    }
  };

  return (
    <Box py={10} bg={pageBg} color={textColor}>
      <Container maxW="md" bg={containerBg} p={8} rounded="md" boxShadow="md">
        <Heading mb={4} color="green.500">Profile Settings</Heading>
        <form onSubmit={handleSubmit}>
          <Avatar src={form.avatar} size="xl" mb={4} />
          <FormControl mb={4}>
            <FormLabel>Profile Picture</FormLabel>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
          </FormControl>
          {/* Address Fields */}
          <FormControl mb={4}>
            <FormLabel>Street</FormLabel>
            <Input name="street" value={form.street} onChange={e => setForm({...form, street: e.target.value})} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>City</FormLabel>
            <Input name="city" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>State</FormLabel>
            <Input name="state" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Zip Code</FormLabel>
            <Input name="zipCode" value={form.zipCode} onChange={e => setForm({...form, zipCode: e.target.value})} />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Name</FormLabel>
            <Input name="name" value={form.name} onChange={handleChange} />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Email</FormLabel>
            <Input name="email" type="email" value={form.email} onChange={handleChange} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Phone</FormLabel>
            <Input name="phone" value={form.phone} onChange={handleChange} />
          </FormControl>
          <Button type="submit" colorScheme="green" width="full">Save Changes</Button>
        </form>
        {/* History now on its own page (see /history) */}
      </Container>
    </Box>
  );
}
