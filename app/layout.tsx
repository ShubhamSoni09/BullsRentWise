import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BullsRentWise - US Rental Risk Checker",
  description: "Quickly scan US rental addresses for local signals, weather-related risks, and affordability context",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        {children}
      </body>
    </html>
  );
}

