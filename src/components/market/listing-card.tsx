
'use client';

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from 'next/navigation';

interface Listing {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  imageUrls: string[];
  createdAt: any;
}

export const ListingCard = ({ listing }: { listing: Listing }) => {
    const router = useRouter();

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(listing.price);

    const handleViewDetails = () => {
        router.push(`/market/listing/${listing.id}`);
    }

    return (
        <Card 
            className="overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-200" 
            onClick={handleViewDetails}
        >
            <CardContent className="p-0">
                <div className="relative aspect-square bg-muted">
                     <Image 
                        src={(listing.imageUrls && listing.imageUrls[0]) || 'https://placehold.co/400x400.png'}
                        alt={listing.title}
                        fill
                        className="object-cover"
                        data-ai-hint="farm product"
                    />
                </div>
                <div className="p-4 space-y-2">
                    <p className="text-lg font-bold">{formattedPrice}</p>
                    <p className="font-semibold leading-tight line-clamp-2">{listing.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{listing.location}</p>
                </div>
            </CardContent>
        </Card>
    )
}
