
export class ComplexUserProcessor {
  processUser(user: any, options: any) {
    if (!user) return null;

    let result = { ...user };

    if (options.validateEmail) {
      if (!user.email || !user.email.includes('@')) {
        result.errors = result.errors || [];
        result.errors.push('Invalid email');
      }
    }

    if (options.validateAge) {
      if (!user.age || user.age < 0 || user.age > 150) {
        result.errors = result.errors || [];
        result.errors.push('Invalid age');
      }
    }

    if (options.formatName) {
      if (user.firstName) {
        result.firstName = user.firstName.trim().toLowerCase();
      }
      if (user.lastName) {
        result.lastName = user.lastName.trim().toLowerCase();
      }
    }

    if (options.calculateScore) {
      let score = 0;
      if (user.experience) score += user.experience * 10;
      if (user.education) score += user.education === 'university' ? 50 : 20;
      if (user.certifications) score += user.certifications.length * 5;
      result.score = score;
    }

    return result;
  }
}
