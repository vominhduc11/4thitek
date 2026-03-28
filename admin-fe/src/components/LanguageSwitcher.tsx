import { Languages } from "lucide-react";
import { ghostButtonClass } from "./ui-kit";
import { useLanguage } from "../context/LanguageContext";

const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();
  const nextLanguage = language === "vi" ? "en" : "vi";
  const label = t("Chuyển ngôn ngữ");

  return (
    <button
      aria-label={label}
      className={`${ghostButtonClass} min-w-0 px-3`}
      onClick={() => setLanguage(nextLanguage)}
      type="button"
    >
      <Languages className="h-4 w-4" />
      <span>{language === "vi" ? "VI" : "EN"}</span>
    </button>
  );
};

export default LanguageSwitcher;
