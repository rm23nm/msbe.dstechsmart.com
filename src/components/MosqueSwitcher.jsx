import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export default function MosqueSwitcher({ mosques, currentMosque, onSwitch }) {
  const isStandalone = import.meta.env.VITE_SINGLE_MOSQUE_MODE === 'true';
  if (isStandalone) return null;
  if (!mosques || mosques.length <= 1) return null;

  return (
    <Select value={currentMosque?.id} onValueChange={onSwitch}>
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <SelectValue placeholder="Pilih Masjid" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {mosques.map((mosque) => (
          <SelectItem key={mosque.id} value={mosque.id}>
            {mosque.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
