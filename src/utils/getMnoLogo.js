export const getMnoLogo = (mnoId) => {
  switch (mnoId) {
    case 1: // Example: Roshan
      return require("../../assets/mnos/roshan.png");
    case 2: // Etisalat
      return require("../../assets/mnos/etisalat.png");
    case 3: // MTN
      return require("../../assets/mnos/mtn.png");
    case 4: // AWCC
      return require("../../assets/mnos/awcc.png");
    case 5: // Salam
      return require("../../assets/mnos/salaam.png");
    default:
      return ""
  }
};