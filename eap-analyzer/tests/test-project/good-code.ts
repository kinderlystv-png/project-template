
export interface User {
  id: string;
  email: string;
  name: string;
}

export class UserService {
  private users: User[] = [];

  createUser(user: Omit<User, 'id'>): User {
    const newUser = { ...user, id: this.generateId() };
    this.users.push(newUser);
    return newUser;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
