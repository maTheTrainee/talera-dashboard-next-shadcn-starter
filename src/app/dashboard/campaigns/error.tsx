'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Icons } from '@/components/icons';

export default function CampaignsError({
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card className='mx-auto max-w-lg'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.warning className='h-5 w-5' /> Kampanjer kunde inte laddas
        </CardTitle>
        <CardDescription>
          PocketBase svarar inte. Kontrollera anslutningen (kallare-server:8090) och försök
          igen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={reset}>
          <Icons.spinner className='mr-2 h-4 w-4' /> Försök igen
        </Button>
      </CardContent>
    </Card>
  );
}