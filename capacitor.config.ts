import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.e6studio.app',
  appName: 'E6 Studio',
  webDir: '.',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;
