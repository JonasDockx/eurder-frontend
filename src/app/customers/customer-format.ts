export function splitEmail(email: string): { user: string; domain: string } {
  const at = email.lastIndexOf('@');
  return at === -1
    ? { user: email, domain: '' }
    : { user: email.slice(0, at), domain: email.slice(at + 1) };
}

export function splitPhone(phone: string): { countryCode: string; number: string } {
  const match = phone.trim().match(/^\+(\d{1,3})\s*(.*)$/);
  return match
    ? { countryCode: match[1], number: match[2] }
    : { countryCode: '', number: phone.trim() };
}
