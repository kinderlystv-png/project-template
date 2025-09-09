
export class ComplexUserProcessor {
  // High cyclomatic complexity method
  processUser(user: any, options: any) {
    if (!user) return null;

    let result = { ...user };
    let hasErrors = false;

    // Email validation
    if (options.validateEmail) {
      if (!user.email) {
        result.errors = result.errors || [];
        result.errors.push('Email is required');
        hasErrors = true;
      } else if (!user.email.includes('@')) {
        result.errors = result.errors || [];
        result.errors.push('Invalid email format');
        hasErrors = true;
      } else if (user.email.length < 5) {
        result.errors = result.errors || [];
        result.errors.push('Email too short');
        hasErrors = true;
      } else if (user.email.length > 50) {
        result.errors = result.errors || [];
        result.errors.push('Email too long');
        hasErrors = true;
      }
    }

    // Age validation
    if (options.validateAge) {
      if (!user.age) {
        result.errors = result.errors || [];
        result.errors.push('Age is required');
        hasErrors = true;
      } else if (user.age < 0) {
        result.errors = result.errors || [];
        result.errors.push('Age cannot be negative');
        hasErrors = true;
      } else if (user.age > 150) {
        result.errors = result.errors || [];
        result.errors.push('Age too high');
        hasErrors = true;
      } else if (user.age < 18 && !options.allowMinors) {
        result.errors = result.errors || [];
        result.errors.push('User must be 18 or older');
        hasErrors = true;
      }
    }

    // Name formatting
    if (options.formatName && !hasErrors) {
      if (user.firstName) {
        result.firstName = user.firstName.trim();
        if (options.capitalizeNames) {
          result.firstName = result.firstName.charAt(0).toUpperCase() +
                           result.firstName.slice(1).toLowerCase();
        }
      }

      if (user.lastName) {
        result.lastName = user.lastName.trim();
        if (options.capitalizeNames) {
          result.lastName = result.lastName.charAt(0).toUpperCase() +
                          result.lastName.slice(1).toLowerCase();
        }
      }
    }

    // Score calculation
    if (options.calculateScore && !hasErrors) {
      let score = 0;

      if (user.experience) {
        if (user.experience < 1) {
          score += 10;
        } else if (user.experience < 3) {
          score += 25;
        } else if (user.experience < 5) {
          score += 40;
        } else {
          score += 50;
        }
      }

      if (user.education) {
        switch (user.education.toLowerCase()) {
          case 'high school':
            score += 10;
            break;
          case 'bachelor':
            score += 30;
            break;
          case 'master':
            score += 40;
            break;
          case 'phd':
            score += 50;
            break;
          default:
            score += 5;
        }
      }

      if (user.certifications && Array.isArray(user.certifications)) {
        score += user.certifications.length * 5;
      }

      result.score = score;
    }

    return result;
  }
}
