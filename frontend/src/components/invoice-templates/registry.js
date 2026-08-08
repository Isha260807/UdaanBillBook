import { GSTBoxedTemplate } from "./invoice/GSTBoxed";
import { ClassicTemplate } from "./invoice/Classic";
import { ModernTemplate } from "./invoice/Modern";
import { MinimalTemplate } from "./invoice/Minimal";
import { BusinessTemplate } from "./invoice/Business";
import { CorporateTemplate } from "./invoice/Corporate";
import { ProfessionalTemplate } from "./invoice/Professional";
import { CustomHTMLTemplate } from "./invoice/CustomHTML";
import { OfficialEWay } from "./eway/OfficialEWay";
import { GreenEWay } from "./eway/GreenEWay";
import { MinimalEWay } from "./eway/MinimalEWay";

export const TEMPLATES = {
  INVOICE: {
    "Standard (Boxed)": { component: GSTBoxedTemplate, sizes: ["A4", "A5"] },
    "GST Boxed": { component: GSTBoxedTemplate, sizes: ["A4", "A5"] },
    "Classic": { component: ClassicTemplate, sizes: ["A4", "Thermal"] },
    "Classic White": { component: ClassicTemplate, sizes: ["A4", "Thermal"] },
    "Modern": { component: ModernTemplate, sizes: ["A4", "Thermal"] },
    "Modern Blue": { component: ModernTemplate, sizes: ["A4", "Thermal"] },
    "Minimal": { component: MinimalTemplate, sizes: ["A4", "Thermal"] },
    "Minimalist": { component: MinimalTemplate, sizes: ["A4", "Thermal"] },
    "Professional": { component: ProfessionalTemplate, sizes: ["A4"] },
    "Business Plus": { component: BusinessTemplate, sizes: ["A4", "A5"] },
    "Corporate Pro": { component: CorporateTemplate, sizes: ["A4"] },
    "Custom HTML": { component: CustomHTMLTemplate, sizes: ["A4"] }
  },
  EWAY: {
    "Official E-Way": { component: OfficialEWay, sizes: ["A4"] },
    "Green E-Way": { component: GreenEWay, sizes: ["A4"] },
    "Minimal E-Way": { component: MinimalEWay, sizes: ["A4"] }
  }
};
