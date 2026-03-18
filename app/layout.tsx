import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Past Exam & Resource Hub",
  description: "A crowdsourced platform for university exams and notes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {/* Notice: No Navbar here, and no usePathname logic */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}