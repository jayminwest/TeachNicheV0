/**
 * Icon Component
 * 
 * A standardized icon system that:
 * - Supports SVG icons for best quality and performance
 * - Dynamically loads icons by name
 * - Provides consistent sizing and styling
 * - Falls back gracefully
 */

"use client";

import { forwardRef } from "react";
import { getAssetPath } from "@/lib/assets";
import { IconSize } from "@/types/assets";
import { LucideIcon, LucideProps } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Import commonly used Lucide icons
import { 
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Menu,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Home,
  Mail,
  Plus,
  Trash,
  Edit,
  Download,
  Upload,
  ExternalLink,
  ShoppingCart,
  Heart,
  Star,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Save,
  MoreHorizontal,
  MoreVertical,
  Filter,
  MoveRight,
} from "lucide-react";

// Map of icon names to Lucide components for quick lookup
const iconMap: Record<string, LucideIcon> = {
  alertCircle: AlertCircle,
  checkCircle: CheckCircle,
  info: Info,
  x: X,
  menu: Menu,
  search: Search,
  user: User,
  settings: Settings,
  logOut: LogOut,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  chevronUp: ChevronUp,
  home: Home,
  mail: Mail,
  plus: Plus,
  trash: Trash,
  edit: Edit,
  download: Download,
  upload: Upload,
  externalLink: ExternalLink,
  shoppingCart: ShoppingCart,
  heart: Heart,
  star: Star,
  calendar: Calendar,
  clock: Clock,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  lock: Lock,
  unlock: Unlock,
  eye: Eye,
  eyeOff: EyeOff,
  save: Save,
  moreHorizontal: MoreHorizontal,
  moreVertical: MoreVertical,
  filter: Filter,
  moveRight: MoveRight,
};

// Sizing map to standardize icon sizes
const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

// Type for the icon source - either a name from our icon library or a custom path
type IconSource = keyof typeof iconMap | string;

export interface IconProps extends Omit<LucideProps, 'ref'> {
  /** The icon to display - either a known icon name or a path to a custom SVG */
  icon: IconSource;
  
  /** Size of the icon */
  size?: IconSize | number;
  
  /** Whether this is a custom SVG icon path rather than a named icon */
  customIcon?: boolean;
  
  /** Optional CSS class names */
  className?: string;
  
  /** For accessibility */
  label?: string;
}

/**
 * Icon component for rendering consistent icons throughout the application
 */
export const Icon = forwardRef<HTMLSpanElement, IconProps>(
  ({ icon, size = "md", customIcon = false, className, label, ...props }, ref) => {
    // Determine the icon size - ensure it's a number
    const iconSize: number = typeof size === "number" ? size : sizeMap[size as IconSize];
    
    // Determine the icon component to render
    let IconComponent = iconMap[icon as keyof typeof iconMap];
    
    // If we have a custom icon or the icon isn't in our map
    if (customIcon || !IconComponent) {
      // For custom SVG icons, we'll use the Image component
      return (
        <span 
          ref={ref}
          className={cn("inline-flex", className)}
          role="img"
          aria-label={label || `${icon} icon`}
        >
          <Image
            src={customIcon ? icon : getAssetPath({ type: 'icon', name: icon as string })}
            width={iconSize}
            height={iconSize}
            alt={label || `${icon} icon`}
            {...props}
          />
        </span>
      );
    }
    
    // For Lucide icons, render the component directly
    return (
      <span 
        ref={ref}
        className={cn("inline-flex", className)}
        role="img"
        aria-label={label || `${icon} icon`}
      >
        <IconComponent
          size={iconSize}
          className={className}
          aria-hidden="true"
          {...props}
        />
      </span>
    );
  }
);

Icon.displayName = "Icon";

/**
 * Dynamically loads an icon by name
 * This is useful for icons that are not used frequently
 */
export function getDynamicIcon(iconName: string) {
  // Check if it's a built-in icon first
  if (iconMap[iconName]) {
    return iconMap[iconName];
  }
  
  // Otherwise, try to load it dynamically
  return dynamic<LucideProps>(() => 
    import('lucide-react').then(mod => {
      return mod[iconName as keyof typeof mod] || mod.HelpCircle;
    }).catch(() => {
      console.error(`Icon "${iconName}" not found, using fallback`);
      return import('lucide-react').then(mod => mod.HelpCircle);
    })
  );
}
