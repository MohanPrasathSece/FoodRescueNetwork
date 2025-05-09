import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Heading, SimpleGrid, Image, Text, useColorModeValue, Spinner, Container } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  // Color scheme: subtle page, colored sections, white cards
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const sectionBg = useColorModeValue('gray.100', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'whiteAlpha.900');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/donations/user/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchHistory();
  }, [user]);

  // filter valid history (completed, expired, claimed)
  const validHistory = history.filter(d => ['completed','expired','claimed'].includes(d.status));
  // group by date using appropriate timestamp
  const grouped = validHistory.reduce((acc, d) => {
    // Use updatedAt for completed to reflect actual click time
    const dateField = d.status === 'completed'
      ? d.updatedAt
      : d.status === 'expired'
        ? (d.expiredAt || d.updatedAt)
        : (d.claimedAt || d.updatedAt);
    const date = new Date(dateField).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(d);
    return acc;
  }, {});

  if (loading) {
    return <Box textAlign="center" py={10}><Spinner /></Box>;
  }

  return (
    <Box color={textColor} minH="100vh" px={8} py={6} bg={pageBg}>
      {Object.entries(grouped).length > 0 ? (
        Object.entries(grouped).map(([date, list]) => (
          <Container key={date} maxW="container.lg" bg={sectionBg} p={6} rounded="lg" mb={6} borderWidth="1px" borderColor={borderColor} boxShadow="md">
            <Heading size="lg" mb={4} color="teal.500">{date}</Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
              {list.map(d => (
                <Box key={d._id} bg={cardBg} p={4} rounded="md" boxShadow="sm" borderLeftWidth="4px" borderLeftColor={d.status === 'completed' ? 'green.400' : 'red.400'}>
                  <Image src={d.imageUrl} alt={d.foodName} boxSize="60px" objectFit="cover" mb={2} rounded="sm" />
                  <Text fontWeight="bold" mb={1}>{d.foodName}</Text>
                  <Text fontSize="sm" mb={1}><strong>Quantity:</strong> {d.quantity} {d.unit}</Text>
                  <Text fontSize="sm" color={d.status === 'completed' ? 'green.600' : 'red.600'}>
                    {d.status === 'completed' ?
                      `Delivered: ${new Date(d.updatedAt).toLocaleString()}` :
                     d.status === 'claimed' ?
                      `Not Delivered: ${new Date(d.claimedAt||d.updatedAt).toLocaleString()}` :
                      `Expired: ${new Date(d.expiredAt).toLocaleString()}`}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Container>
        ))
      ) : (
        history.length > 0 ? (
          <Text textAlign="center" color="orange.400">No valid completed/expired deliveries found in your history data. (Raw data exists, but may have unexpected structure.)</Text>
        ) : (
          <Text textAlign="center" color="gray.500">
            {user && user.role === 'volunteer'
              ? 'No delivery history yet. Completed/expired deliveries will show here.'
              : 'No donation history yet. Completed/expired donations will show here.'}
          </Text>
        )
      )}
    </Box>
  );
}
