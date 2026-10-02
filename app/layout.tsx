import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Hindsight — Weekly investment review',description:'Understand your stocks, explore the evidence, and keep what you learn.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body className="antialiased">{children}</body></html>;}
