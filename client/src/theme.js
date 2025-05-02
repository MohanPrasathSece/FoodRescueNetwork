import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f4ea',
      100: '#c1e7c8',
      200: '#98d9a2',
      300: '#6ec97a',
      400: '#46b95c',
      500: '#319442',
      600: '#1f7032',
      700: '#0e4c1f',
      800: '#002a0b',
      900: '#001205',
    },
  },
  fonts: {
    heading: 'Montserrat, sans-serif',
    body: 'Open Sans, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
      a: {
        color: 'brand.500',
        _hover: { color: 'brand.600' },
      },
    },
  },
  components: {
    Button: {
      variants: {
        solid: (props) => ({
          bg: 'brand.500',
          color: 'white',
          _hover: { bg: 'brand.600' },
        }),
      },
    },
  },
});

export default theme;
