
export interface User {
  id: string;
  email: string;
  name: string;
}

export class UserService {
  private users: User[] = [];

  create(user: Omit<User, 'id'>): User {
    const newUser = { ...user, id: this.generateId() };
    this.users.push(newUser);
    return newUser;
  }

  findById(id: string): User | null {
    return this.users.find(user => user.id === id) || null;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
