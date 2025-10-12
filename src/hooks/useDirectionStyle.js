import { useLanguage } from "../context/LanguageContext";

export const useDirectionStyle = () => {
  const { isRTL } = useLanguage();

  const textAlign = (align = "start") => {
    if (align === "start") return isRTL ? "right" : "left";
    if (align === "end") return isRTL ? "left" : "right";
    return align; 
  };

  const flexDirection = (dir = "row") => {
    if (dir === "row") return isRTL ? "row-reverse" : "row";
    if (dir === "row-reverse") return isRTL ? "row" : "row-reverse";
    return dir;
  };

  return { textAlign, flexDirection };
};