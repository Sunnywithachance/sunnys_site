import "./globals.css";

export const metadata = {
  title: "Food Search",
  description: "Centered food suggestion input"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
