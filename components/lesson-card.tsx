import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Lock, Download } from "lucide-react"
import { formatPrice } from "@/utilities/formatting/currency"

interface LessonCardProps {
  id: string
  title: string
  thumbnailUrl: string
  price: number
  isPurchased?: boolean
  videoCount?: number
  instructorName?: string
}

export function LessonCard({ id, title, thumbnailUrl, price, isPurchased = false, videoCount = 0, instructorName = "Instructor" }: LessonCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video overflow-hidden relative">
        <Image
          src={thumbnailUrl || "/placeholder.svg?height=200&width=300"}
          alt={title}
          fill
          className="object-cover transition-transform hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {isPurchased && (
          <div className="absolute top-2 right-2">
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Purchased</span>
            </Badge>
          </div>
        )}
      </div>
      <CardHeader className="p-4">
        <CardTitle className="line-clamp-1 text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex justify-between items-center">
        <p className="font-medium text-lg">
          {/* Pass price number directly, matching formatPrice definition */}
          {price === 0 ? "Free" : formatPrice(price)} 
        </p>
        <p className="text-sm text-muted-foreground">{instructorName}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full" variant={isPurchased ? "outline" : "default"}>
          <Link href={`/lessons/${id}`}>
            {isPurchased ? (
              "View Lesson"
            ) : price === 0 ? ( // Check price directly
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Get Free Access
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Purchase Access
              </span>
            )}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
