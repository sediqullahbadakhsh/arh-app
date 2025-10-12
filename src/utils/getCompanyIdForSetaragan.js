export const getSetaraganMnoId = function getValueFromLocalNumber(localNumber) {
  if (!localNumber) return null;


  const prefix = localNumber.toString().slice(0, 2);

  if (['78', '73'].includes(prefix)) return 2;
  if (['76', '77'].includes(prefix)) return 4;
  if (['74'].includes(prefix)) return 1;
  if (['79', '72'].includes(prefix)) return 3;
  if (['70', '71'].includes(prefix)) return 5;

  return null; // if no match found
}