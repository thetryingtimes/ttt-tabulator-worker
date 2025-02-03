export const getTodaysDate = () => {
  const today = new Date();
  today.setDate(today.getDate() - 7);

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 00:00:00`;
};
