
export class DuplicatedValidation {
  validateUserEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    return true;
  }
  
  validateAdminEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (!email.endsWith('@company.com')) return false;
    return true;
  }
  
  validateGuestEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (email.includes('+')) return false;
    return true;
  }
}
