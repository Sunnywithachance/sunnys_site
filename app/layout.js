import "./globals.css";
import { Cherry_Bomb_One, Sour_Gummy } from "next/font/google";

const cherryBombOne = Cherry_Bomb_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-cherry-bomb-one"
});

const sourGummy = Sour_Gummy({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sour-gummy"
});

export const metadata = {
  title: "GutCheck",
  description: "Centered food suggestion input"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#D7F8BB"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png" />
        <link rel="apple-touch-icon" sizes="150x150" href="/icons/apple-touch-icon-150.png" />
        <meta name="apple-mobile-web-app-title" content="GutCheck" />
      </head>
      <body className={`${cherryBombOne.className} ${cherryBombOne.variable} ${sourGummy.variable}`}>
        {children}
      </body>
    </html>
  );
}
