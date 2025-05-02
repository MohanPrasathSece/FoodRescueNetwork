import { Box, Container, Stack, Text, Link, Icon } from '@chakra-ui/react';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';

export default function Footer() {
  return (
    <Box bg="brand.700" color="white" py={10}>
      <Container maxW="6xl">
        <Stack
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align="center"
        >
          <Text>© {new Date().getFullYear()} Food Rescue Network. All rights reserved.</Text>
          <Stack direction="row" spacing={4}>
            <Link href="#" aria-label="Facebook"><Icon as={FaFacebook} boxSize={5} /></Link>
            <Link href="#" aria-label="Twitter"><Icon as={FaTwitter} boxSize={5} /></Link>
            <Link href="#" aria-label="Instagram"><Icon as={FaInstagram} boxSize={5} /></Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
