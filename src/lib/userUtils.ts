export const maskPhone = (phone: string | null | undefined) => {
  if (!phone) return 'Người dùng';
  
  // Example: +84123456789 -> *******789
  const length = phone.length;
  if (length <= 3) return phone;
  
  const last3 = phone.slice(-3);
  return '*******' + last3;
};

export const getDisplayName = (user: { displayName?: string; phoneNumber?: string | null }) => {
  if (user.displayName && user.displayName.trim() !== '') {
    return user.displayName;
  }
  return maskPhone(user.phoneNumber);
};
