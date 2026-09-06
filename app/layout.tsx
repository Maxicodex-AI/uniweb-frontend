import "./globals.css";
import AppShell from "./AppShell";

export const metadata = {
  title: "UniWeb — Academic Platform",
  description:
    "A smart academic communication platform for students, lecturers and administrators",
  manifest: "/manifest.json",
  themeColor: "#16a34a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UniWeb",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="UniWeb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>

      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}