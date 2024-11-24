import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Fleet Manager",
  description: "A fleet manager",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="bg-gradient-to-b from-[#7A003F] to-[#52002A] h-screen w-screen m-0 p-0">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
