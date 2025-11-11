import '../styles/global.css';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/LOGO.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/LOGO.png" />
        <meta name="theme-color" content="#111827" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}