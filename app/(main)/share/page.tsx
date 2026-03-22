"use client"

import { usePathname } from "next/navigation"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ShareButton(){
    const pathname = usePathname()
    const handleShare = async ()=>{
        const url = `${window.location.origin}${pathname}`

        await navigator.clipboard.writeText(url)
        alert("Link copied") // am gonna change this into a toast message
    }

    return(
        <Button variant="outline" className="w-full h-11 gap-2 border-zinc-200" onClick={handleShare}>
              <Share2 className="h-4 w-4" /> Share
        </Button>
    )
}