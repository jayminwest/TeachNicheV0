"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, X } from "lucide-react"
import type { User } from "@supabase/supabase-js"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) {
        console.error("Supabase client not initialized");
        setLoading(false);
        return;
      }
      
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }

    getUser()

    if (!supabase) {
      console.error("Supabase client not initialized");
      return () => {};
    }
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    try {
      // Use fetch API to call server-side signout
      const response = await fetch('/api/auth/signout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Force a page reload to ensure all auth state is cleared
        window.location.href = "/"
      } else {
        console.error("Error signing out via API:", await response.text());
        
        // Fallback to client-side signout if server-side fails
        if (supabase) {
          await supabase.auth.signOut();
        }
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error signing out:", error);
      
      // Final fallback
      try {
        if (supabase) {
          await supabase.auth.signOut({ scope: 'global' });
        }
        window.location.href = "/";
      } catch (e) {
        console.error("Final signout attempt failed:", e);
        // Force reload anyway
        window.location.href = "/";
      }
    }
  }

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Lessons", href: "/lessons" },
    ...(user
      ? [
          { name: "Library", href: "/library" },
          { name: "Dashboard", href: "/dashboard" },
          { name: "Profile", href: "/dashboard/profile" },
        ]
      : []),
  ]

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/favicon.png"
              alt="Teach Niche Logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="font-bold text-xl">
              <span className="text-primary">Teach</span>
              <span className="text-foreground"> Niche</span>
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden md:flex gap-4">
          {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
          {!loading && (
            <>
              {user ? (
                <Button variant="ghost" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/auth/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/sign-up">Sign Up</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
        <button 
          className="flex items-center justify-center md:hidden" 
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {isMenuOpen && (
        <div className="md:hidden py-4 border-t">
          <div className="container flex flex-col space-y-4">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col space-y-4 pt-4 border-t">
              {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
              {!loading && (
                <>
                  {user ? (
                    <Button variant="ghost" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" asChild>
                        <Link href="/auth/sign-in" onClick={() => setIsMenuOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link href="/auth/sign-up" onClick={() => setIsMenuOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

