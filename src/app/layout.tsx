import "./globals.css";
import React from "react";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata = {
  title: "V-Stock Social",
  description: "Stock tracking and social features",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
