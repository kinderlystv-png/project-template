
export class DuplicatedEmailValidation {
  validateUserEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (email.length > 50) return false;
    if (!email.match(/^[^s@]+@[^s@]+.[^s@]+$/)) return false;
    return true;
  }

  validateAdminEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (email.length > 50) return false;
    if (!email.match(/^[^s@]+@[^s@]+.[^s@]+$/)) return false;
    if (!email.endsWith('@company.com')) return false;
    return true;
  }

  validateGuestEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (email.length > 50) return false;
    if (!email.match(/^[^s@]+@[^s@]+.[^s@]+$/)) return false;
    if (email.includes('+')) return false;
    return true;
  }

  validateSupportEmail(email: string) {
    if (!email) return false;
    if (!email.includes('@')) return false;
    if (email.length < 5) return false;
    if (email.length > 50) return false;
    if (!email.match(/^[^s@]+@[^s@]+.[^s@]+$/)) return false;
    if (!email.endsWith('@support.company.com')) return false;
    return true;
  }
}
