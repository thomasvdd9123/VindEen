import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Profile, Location } from "@shared/schema";
import { Link } from "wouter";
import { MapPin, Phone, Mail, Globe, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const verifiedIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface ProfileWithLocation extends Profile {
  location?: Location | null;
}

interface SearchMapProps {
  profiles: ProfileWithLocation[];
  locations?: Location[];
  className?: string;
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(pos => L.latLng(pos[0], pos[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [map, positions]);
  
  return null;
}

export function SearchMap({ profiles, locations = [], className = "" }: SearchMapProps) {
  const belgiumCenter: [number, number] = [50.85, 4.35];
  
  const profilesWithCoords = profiles.map(profile => {
    const location = profile.location || locations.find(loc => loc.id === profile.locationId);
    return {
      ...profile,
      location: location || null,
      lat: location?.latitude || null,
      lng: location?.longitude || null,
    };
  }).filter(p => p.lat !== null && p.lng !== null);

  const positions: [number, number][] = profilesWithCoords.map(p => [p.lat!, p.lng!]);

  if (profilesWithCoords.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`}>
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Geen locaties om weer te geven</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`}>
      <MapContainer
        center={belgiumCenter}
        zoom={8}
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={positions} />
        {profilesWithCoords.map((profile) => (
          <Marker
            key={profile.id}
            position={[profile.lat!, profile.lng!]}
            icon={profile.isVerified ? verifiedIcon : defaultIcon}
          >
            <Popup className="profile-popup" maxWidth={300} minWidth={250}>
              <div className="p-1">
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="font-semibold text-base leading-tight flex-1">
                    {profile.name}
                  </h3>
                  {profile.isVerified && (
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs shrink-0">
                      <CheckCircle className="h-3 w-3" />
                      Geverifieerd
                    </Badge>
                  )}
                </div>
                
                {profile.title && (
                  <p className="text-sm text-muted-foreground mb-2">{profile.title}</p>
                )}
                
                <div className="space-y-1 text-sm mb-3">
                  {profile.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{profile.location.name}</span>
                    </div>
                  )}
                  {profile.telnr && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{profile.telnr}</span>
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                </div>
                
                <Link href={`/bedrijf/${profile.slug}`}>
                  <Button size="sm" className="w-full" data-testid={`button-view-profile-${profile.slug}`}>
                    Bekijk profiel
                  </Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
