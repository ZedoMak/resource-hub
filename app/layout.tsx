import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

// Using Inter for that clean, modern, technical look
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Past Exam & Resource Hub",
  description: "A crowdsourced platform for Ethiopian university exams and notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}