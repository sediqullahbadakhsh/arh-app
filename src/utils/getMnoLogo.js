import roshanLogo from '../../assets/mnos/roshan.png';
import etisalatLogo from '../../assets/mnos/etisalat.png';
import mtnLogo from '../../assets/mnos/mtn.png';
import awccLogo from '../../assets/mnos/awcc.png';
import salaamLogo from '../../assets/mnos/salaam.png';

const mnoLogos = {
  1: roshanLogo,
  2: etisalatLogo,
  3: mtnLogo,
  4: awccLogo,
  5: salaamLogo,
};

export const getMnoLogo = (mnoId) => mnoLogos[mnoId] || '';