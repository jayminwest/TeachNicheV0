/**
 * A custom React hook that detects if the viewport is mobile-sized.
 * 
 * @returns {boolean} Returns true if the current viewport width is less than the mobile breakpoint
 */
import * as React from "react";

/**
 * The width threshold in pixels that defines a mobile viewport
 */
const MOBILE_BREAKPOINT = 768;

/**
 * React hook that detects if the current viewport is mobile sized.
 * Uses a media query to detect changes in the viewport width.
 * 
 * @example
 * ```tsx
 * import { useIsMobile } from "@/hooks/ui/useIsMobile";
 * 
 * function ResponsiveComponent() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <div>
 *       {isMobile ? "Mobile View" : "Desktop View"}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsMobile(): boolean {
  // Initialize with undefined to properly handle server-side rendering
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Skip effect during SSR
    if (typeof window === "undefined") return;
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Set initial value
    onChange();
    
    mql.addEventListener("change", onChange);
    
    // Clean up event listener on unmount
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Return false as default value during SSR or initial render
  return isMobile ?? false;
}
