"use client";

import Link from "next/link";
import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";

export function Hero() {
  return (
    <div className="w-full relative h-[600px]" data-testid="hero-section">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <OptimizedImage
          assetName
          category="hero"
          src="kendama-group"
          alt="Kendama players group"
          fill
          className="w-full h-full object-cover filter grayscale brightness-[0.4]"
          responsive
          priority
          formats={["webp", "jpg"]}
        />
      </div>
      <div className="container mx-auto relative z-10 h-full">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col">
            <h1 className="text-3xl sm:text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular px-4 text-white">
              <span className="text-primary">Support</span>
              <span className="font-semibold"> Community</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl leading-relaxed tracking-tight text-white/80 max-w-2xl text-center px-4">
              Learn from expert instructors and take your kendama skills to the next level.
              High-quality tutorials for players of all skill levels.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 px-4 w-full max-w-xs sm:max-w-none justify-center">
            <Link href="/lessons" className="w-full sm:w-auto">
              <Button size="lg" className="gap-2 w-full sm:w-auto" variant="default">
                Browse Lessons <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/auth/sign-up" className="w-full sm:w-auto">
              <Button 
                size="lg"
                className="gap-2 w-full sm:w-auto"
                variant="outline"
              >
                Create Account <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
