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
  title: "Food Search",
  description: "Centered food suggestion input",
  themeColor: "#D8F7B8"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#D8F7B8"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${cherryBombOne.className} ${cherryBombOne.variable} ${sourGummy.variable}`}>
        {children}
      </body>
    </html>
  );
}
