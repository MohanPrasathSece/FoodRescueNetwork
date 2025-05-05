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
          <Text>
            Contact: <Link href="tel:+919025421149" color="teal.200">+91 90254 21149</Link> | <Link href="mailto:mohanprasath563@gmail.com" color="teal.200">mohanprasath563@gmail.com</Link>
          </Text>
          <Stack direction="row" spacing={4}>
            <Link href="#" aria-label="Facebook"><Icon as={FaFacebook} boxSize={5} /></Link>
            <Link href="#" aria-label="Twitter"><Icon as={FaTwitter} boxSize={5} /></Link>
            <Link
              href="https://www.instagram.com/food_rescue_network?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              isExternal
              aria-label="Instagram"
            >
              <Icon as={FaInstagram} boxSize={5} />
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
