"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Doctor {
  id: string;
  name: string;
  clinicName: string;
  latitude: number;
  longitude: number;
  sessionFee: number;
  headshotUrl: string;
}

interface MapProps {
  doctors: Doctor[];
  hoveredDocId: string | null;
  centerLat: number | null;
  centerLng: number | null;
  onBookDoc: (doc: Doctor) => void;
  onHoverDoc: (docId: string | null) => void;
}

// Generate premium custom SVG price-badge icons
const createMarkerIcon = (name: string, fee: number, isHovered: boolean) => {
  const formattedFee = fee > 500 ? `PKR ${fee.toLocaleString()}` : `$${fee}`;
  const lastName = name.split(" ").pop() || name;

  return L.divIcon({
    className: "custom-div-icon-wrapper",
    html: `
      <div class="flex flex-col items-center pointer-events-auto cursor-pointer transition-all duration-300">
        <div class="px-2.5 py-1 text-[10px] font-bold text-white rounded-xl border border-white/80 shadow-md transition-all duration-300 whitespace-nowrap ${
          isHovered
            ? "bg-emerald-600 ring-4 ring-emerald-500/20 scale-110 -translate-y-1 font-extrabold"
            : "bg-slate-800 hover:bg-slate-900"
        }">
          ${lastName} &bull; ${formattedFee}
        </div>
        <div class="w-2.5 h-2.5 rotate-45 -mt-1 border-r border-b border-white/80 shadow-sm transition-colors duration-300 ${
          isHovered ? "bg-emerald-600" : "bg-slate-800"
        }"></div>
      </div>
    `,
    iconSize: [80, 36],
    iconAnchor: [40, 36],
    popupAnchor: [0, -36],
  });
};

export default function Map({
  doctors,
  hoveredDocId,
  centerLat,
  centerLng,
  onBookDoc,
  onHoverDoc,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, { marker: L.Marker; doctor: Doctor }>>({});

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Set initial center coordinates: use center coords, first doctor, or Islamabad PK
    let initialLat = 33.6844;
    let initialLng = 73.0479;
    const initialZoom = 12;

    if (centerLat && centerLng) {
      initialLat = centerLat;
      initialLng = centerLng;
    } else if (doctors.length > 0) {
      initialLat = doctors[0].latitude;
      initialLng = doctors[0].longitude;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([initialLat, initialLng], initialZoom);

    // Standard OpenStreetMap tiles (Calm theme)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Standard zoom controls on bottom right
    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

    mapInstanceRef.current = map;

    // Handle popup click delegation to trigger React slot booking
    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const docId = target.getAttribute("data-book-doc-id");
      if (docId) {
        const found = doctors.find((d) => d.id === docId);
        if (found) {
          onBookDoc(found);
        }
      }
    };

    mapContainerRef.current.addEventListener("click", handlePopupClick);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      mapContainerRef.current?.removeEventListener("click", handlePopupClick);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Re-center map when search location coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (centerLat && centerLng) {
      map.flyTo([centerLat, centerLng], 12, { duration: 1.5 });
    } else if (doctors.length > 0) {
      // Find average or first doctor coordinates to center
      map.flyTo([doctors[0].latitude, doctors[0].longitude], 12, { duration: 1.5 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLat, centerLng, doctors.length === 0]);

  // 3. Clear and Plot Doctor Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers
    Object.values(markersRef.current).forEach(({ marker }) => {
      marker.remove();
    });
    markersRef.current = {};

    // Plot new markers
    doctors.forEach((doc) => {
      const isHovered = doc.id === hoveredDocId;
      const marker = L.marker([doc.latitude, doc.longitude], {
        icon: createMarkerIcon(doc.name, doc.sessionFee, isHovered),
        zIndexOffset: isHovered ? 1000 : 0,
      }).addTo(map);

      // Create a neat modern popup contents
      const formattedFee = doc.sessionFee > 500 ? `PKR ${doc.sessionFee.toLocaleString()}` : `$${doc.sessionFee}`;
      const popupContent = `
        <div class="p-3 w-56 flex flex-col gap-2.5">
          <div class="flex items-center gap-3">
            <img src="${doc.headshotUrl}" class="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-inner flex-shrink-0" alt="${doc.name}" />
            <div class="overflow-hidden">
              <h5 class="font-display font-bold text-xs text-slate-900 truncate leading-tight">${doc.name}</h5>
              <p class="text-[9px] text-slate-500 font-semibold truncate mt-0.5">${doc.clinicName}</p>
            </div>
          </div>
          <div class="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-0.5">
            <div class="flex flex-col">
              <span class="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Session Fee</span>
              <span class="font-bold text-[11px] text-slate-800 leading-none">${formattedFee}</span>
            </div>
            <button class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[9px] cursor-pointer shadow-sm transition-all duration-200" data-book-doc-id="${doc.id}">
              Book Slot
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        maxWidth: 240,
      });

      // Synchronize map pin interactions with sidebar hover
      marker.on("mouseover", () => {
        onHoverDoc(doc.id);
      });
      marker.on("mouseout", () => {
        onHoverDoc(null);
      });

      markersRef.current[doc.id] = { marker, doctor: doc };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors]);

  // 4. Update Icons dynamically when list hover changes
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, { marker, doctor }]) => {
      const isHovered = id === hoveredDocId;
      marker.setIcon(createMarkerIcon(doctor.name, doctor.sessionFee, isHovered));
      marker.setZIndexOffset(isHovered ? 1000 : 0);

      // Programmatically fly slightly or open the popup
      if (isHovered) {
        marker.openPopup();
      } else {
        // Only close if it was opened by hover to prevent closing active click selections
        const popup = marker.getPopup();
        if (popup && popup.isOpen()) {
          // Allow users to click and keep open, hover opens, leaving closes
          mapInstanceRef.current?.closePopup(popup);
        }
      }
    });
  }, [hoveredDocId]);

  return (
    <div className="w-full h-full relative z-10 bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
