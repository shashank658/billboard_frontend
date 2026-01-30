import { MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegionsTab } from './RegionsTab';
import { CitiesTab } from './CitiesTab';
import { ZonesTab } from './ZonesTab';

export default function LocationsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Location Management</h1>
          <p className="text-muted-foreground">
            Manage regions, cities, and zones for organizing billboards
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Locations Hierarchy</CardTitle>
          <CardDescription>
            Organize your billboard locations using a Region &rarr; City &rarr; Zone hierarchy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="regions" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="regions">Regions</TabsTrigger>
              <TabsTrigger value="cities">Cities</TabsTrigger>
              <TabsTrigger value="zones">Zones</TabsTrigger>
            </TabsList>
            <div className="mt-6">
              <TabsContent value="regions" className="mt-0">
                <RegionsTab />
              </TabsContent>
              <TabsContent value="cities" className="mt-0">
                <CitiesTab />
              </TabsContent>
              <TabsContent value="zones" className="mt-0">
                <ZonesTab />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
